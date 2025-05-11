// app/api/dashboard/stats/route.ts
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
    
    // Set time range for search
    const now = new Date();
    
    let startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    
    let endDate = endDateParam
      ? new Date(endDateParam + 'T23:59:59.999Z')  // End of the selected date
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today
    
    const dateFilter = { 
      soldAt: { 
        $gte: startDate, 
        $lte: endDate 
      } 
    };

    // Count tickets and calculate revenue in date range
    const totalTicketsSold = await Ticket.countDocuments(dateFilter);
    const totalRevenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

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

    // Hourly ticket sales data (today)
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
    const cashPercentage = totalPayments > 0 ? Math.round((cashCount / totalPayments) * 100) : 65; // default 65% if no data
    const qrPercentage = totalPayments > 0 ? Math.round((qrCount / totalPayments) * 100) : 35; // default 35% if no data

    // Format hourly tickets data
    const formattedHourlyTickets = hourlyTickets.map(item => ({
      _id: item._id,
      count: item.count,
      revenue: item.revenue
    }));

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats' 
    }, { status: 500 });
  }
}