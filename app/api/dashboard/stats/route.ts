// app/api/dashboard/stats/route.ts - Updated with Booking Integration
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Booking from '@/models/Booking';

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

    // **Original Ticket Stats (Walk-in + Booking tickets)**
    const totalTicketsSold = await Ticket.countDocuments(dateFilter);
    
    const totalRevenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // **🆕 Booking Statistics**
    const bookingDateFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Booking counts by status
    const bookingStats = await Booking.aggregate([
      { $match: bookingDateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    // Transform booking stats into readable format
    const bookingStatsFormatted = {
      pending: { count: 0, revenue: 0 },
      approved: { count: 0, revenue: 0 },
      rejected: { count: 0, revenue: 0 },
      expired: { count: 0, revenue: 0 }
    };

    bookingStats.forEach(stat => {
      if (bookingStatsFormatted[stat._id as keyof typeof bookingStatsFormatted]) {
        bookingStatsFormatted[stat._id as keyof typeof bookingStatsFormatted] = {
          count: stat.count,
          revenue: stat.revenue
        };
      }
    });

    // Total bookings
    const totalBookings = bookingStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalBookingRevenue = bookingStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const approvedBookingRevenue = bookingStatsFormatted.approved.revenue;

    // **🆕 Revenue Breakdown by Channel**
    const walkInTickets = await Ticket.countDocuments({ 
      ...dateFilter, 
      $or: [
        { isFromBooking: { $ne: true } },
        { isFromBooking: { $exists: false } }
      ]
    });

    const bookingTickets = await Ticket.countDocuments({ 
      ...dateFilter, 
      isFromBooking: true 
    });

    const walkInRevenueResult = await Ticket.aggregate([
      { 
        $match: { 
          ...dateFilter,
          $or: [
            { isFromBooking: { $ne: true } },
            { isFromBooking: { $exists: false } }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const walkInRevenue = walkInRevenueResult.length > 0 ? walkInRevenueResult[0].total : 0;

    const bookingTicketRevenueResult = await Ticket.aggregate([
      { $match: { ...dateFilter, isFromBooking: true } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const bookingTicketRevenue = bookingTicketRevenueResult.length > 0 ? bookingTicketRevenueResult[0].total : 0;

    // **Staff & Driver Stats (unchanged)**
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    
    const checkedInDrivers = await User.countDocuments({ 
      role: 'driver',
      checkInStatus: 'checked-in'
    });
    
    const checkedInStaff = await User.countDocuments({ 
      role: 'staff',
      checkInStatus: 'checked-in'
    });

    // **Hourly ticket sales data (unchanged)**
    const hourlyTickets = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $hour: "$soldAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // **Payment method statistics (unchanged)**
    const paymentMethodStats = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 }
        }
      }
    ]);

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

    const formattedHourlyTickets = hourlyTickets.map(item => ({
      _id: item._id,
      count: item.count,
      revenue: item.revenue
    }));

    // **🆕 Enhanced Result with Booking Data**
    const result = {
      // Original stats
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
      },
      
      // 🆕 Booking System Stats
      bookingSystem: {
        totalBookings,
        totalBookingRevenue,
        approvedBookingRevenue,
        bookingsByStatus: bookingStatsFormatted,
        
        // Revenue breakdown
        revenueBreakdown: {
          walkIn: {
            tickets: walkInTickets,
            revenue: walkInRevenue,
            percentage: totalRevenue > 0 ? Math.round((walkInRevenue / totalRevenue) * 100) : 0
          },
          booking: {
            tickets: bookingTickets,
            revenue: bookingTicketRevenue,
            percentage: totalRevenue > 0 ? Math.round((bookingTicketRevenue / totalRevenue) * 100) : 0
          }
        },
        
        // Conversion metrics
        conversionRate: totalBookings > 0 ? Math.round((bookingStatsFormatted.approved.count / totalBookings) * 100) : 0,
        avgBookingValue: bookingStatsFormatted.approved.count > 0 ? Math.round(approvedBookingRevenue / bookingStatsFormatted.approved.count) : 0
      }
    };
    
    console.log('Returning enhanced dashboard stats with booking data:', {
      totalTicketsSold: result.totalTicketsSold,
      totalRevenue: result.totalRevenue,
      totalBookings: result.bookingSystem.totalBookings,
      bookingRevenue: result.bookingSystem.totalBookingRevenue,
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