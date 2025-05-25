// app/api/dashboard/stats/route.ts - ปรับปรุงให้คำนวณสถิติได้แม่นยำยิ่งขึ้น
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    console.log('Dashboard stats request - Start Date:', startDateParam, 'End Date:', endDateParam);
    
    // Set time range for search
    const now = new Date();
    
    let startDate: Date;
    let endDate: Date;
    
    if (startDateParam) {
      startDate = new Date(startDateParam + 'T00:00:00.000Z');
    } else {
      // Default to start of today
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    if (endDateParam) {
      endDate = new Date(endDateParam + 'T23:59:59.999Z');
    } else {
      // Default to end of today
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }
    
    console.log('Calculated date range:', startDate, 'to', endDate);
    
    const dateFilter = { 
      soldAt: { 
        $gte: startDate, 
        $lte: endDate 
      } 
    };

    // **Debug: ตรวจสอบจำนวนตั๋วทั้งหมดในฐานข้อมูล**
    const allTicketsCount = await Ticket.countDocuments();
    console.log('Total tickets in database:', allTicketsCount);

    // Count tickets and calculate revenue in date range
    const totalTicketsSold = await Ticket.countDocuments(dateFilter);
    console.log('Tickets sold in date range:', totalTicketsSold);
    
    // **Debug: ดึงตั๋วจริงๆ เพื่อตรวจสอบ**
    const actualTickets = await Ticket.find(dateFilter).select('soldAt price paymentMethod');
    console.log('Actual tickets found:', actualTickets.length);
    if (actualTickets.length > 0) {
      console.log('Sample tickets:', actualTickets.slice(0, 3).map(t => ({
        soldAt: t.soldAt,
        price: t.price,
        paymentMethod: t.paymentMethod
      })));
    }
    
    const totalRevenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
    
    console.log('Total revenue calculated:', totalRevenue);

    // Count total drivers and staff (ticket sellers)
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    
    // Count checked-in drivers and staff
    const checkedInDrivers = await User.countDocuments({ 
      role: 'driver',
      checkInStatus: 'checked-in'
    });
    
    const checkedInStaff = await User.countDocuments({ 
      role: 'staff',
      checkInStatus: 'checked-in'
    });

    // Hourly ticket sales data (for the date range)
    const hourlyTickets = await Ticket.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: { $hour: "$soldAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Payment method statistics
    const paymentMethodStats = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert payment stats to the expected format
    let cashCount = 0;
    let qrCount = 0;

    paymentMethodStats.forEach(stat => {
      if (stat._id === 'cash') {
        cashCount = stat.count;
      } else if (stat._id === 'qr') {
        qrCount = stat.count;
      }
    });

    const totalPayments = cashCount + qrCount;
    const cashPercentage = totalPayments > 0 ? Math.round((cashCount / totalPayments) * 100) : 50;
    const qrPercentage = totalPayments > 0 ? Math.round((qrCount / totalPayments) * 100) : 50;

    // Format hourly tickets data
    const formattedHourlyTickets = hourlyTickets.map(item => ({
      _id: item._id,
      count: item.count,
      revenue: item.revenue
    }));

    const result = {
      totalTicketsSold,
      totalRevenue,
      totalDrivers,
      totalStaff,
      checkedInDrivers,
      checkedInStaff,
      hourlyTickets: formattedHourlyTickets,
      paymentMethodStats: {
        cash: cashPercentage,
        qr: qrPercentage
      }
    };
    
    console.log('Returning dashboard stats:', {
      totalTicketsSold: result.totalTicketsSold,
      totalRevenue: result.totalRevenue,
      dateRange: `${startDate} to ${endDate}`
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}