// app/api/reports/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Income from '@/models/Income';
import WorkLog from '@/models/WorkLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Set default date range (today)
    const today = new Date();
    const defaultStart = startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const defaultEnd = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    console.log('Report request:', { reportType, startDate, endDate });
    
    switch (reportType) {
      case 'sales':
        return await getSalesReport(defaultStart, defaultEnd);
      case 'drivers':
        return await getDriverReport(defaultStart, defaultEnd);
      case 'routes':
        return await getRouteReport(defaultStart, defaultEnd);
      case 'financial':
        return await getFinancialReport(defaultStart, defaultEnd);
      case 'summary':
        return await getSummaryReport(defaultStart, defaultEnd);
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reports API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Sales Report
async function getSalesReport(startDate: Date, endDate: Date) {
  const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
  
  // Basic stats
  const totalTickets = await Ticket.countDocuments(dateFilter);
  const revenueResult = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;
  
  // Payment method breakdown
  const paymentStats = await Ticket.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        revenue: { $sum: '$price' }
      }
    }
  ]);
  
  // Hourly sales
  const hourlySales = await Ticket.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: { $hour: '$soldAt' },
        count: { $sum: 1 },
        revenue: { $sum: '$price' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
  
  // Daily sales trend (last 7 days)
  const weekAgo = new Date(startDate);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const dailyTrend = await Ticket.aggregate([
    { 
      $match: { 
        soldAt: { $gte: weekAgo, $lte: endDate } 
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$soldAt' },
          month: { $month: '$soldAt' },
          day: { $dayOfMonth: '$soldAt' }
        },
        count: { $sum: 1 },
        revenue: { $sum: '$price' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  return NextResponse.json({
    type: 'sales',
    period: { startDate, endDate },
    summary: {
      totalTickets,
      totalRevenue,
      averagePrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0
    },
    paymentMethods: paymentStats,
    hourlySales,
    dailyTrend
  });
}

// Driver Report
async function getDriverReport(startDate: Date, endDate: Date) {
  // Get all drivers
  const allDrivers = await User.find({ role: 'driver' })
    .select('name employeeId checkInStatus');
  
  // Work logs for the period
  const dateString = startDate.toISOString().split('T')[0];
  const endDateString = endDate.toISOString().split('T')[0];
  
  const workLogs = await WorkLog.aggregate([
    {
      $match: {
        date: { $gte: dateString, $lte: endDateString }
      }
    },
    {
      $group: {
        _id: '$user_id',
        totalLogs: { $sum: 1 },
        checkIns: {
          $sum: { $cond: [{ $eq: ['$action', 'check-in'] }, 1, 0] }
        },
        checkOuts: {
          $sum: { $cond: [{ $eq: ['$action', 'check-out'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    }
  ]);
  
  // Driver income for the period
  const driverIncome = await Income.getAllDriversDailyIncome(dateString);
  
  // Combine data
  const driverStats = allDrivers.map(driver => {
    const workData = workLogs.find(log => log._id.toString() === driver._id.toString());
    const incomeData = driverIncome.find(income => income.driverId.toString() === driver._id.toString());
    
    return {
      id: driver._id,
      name: driver.name,
      employeeId: driver.employeeId,
      checkInStatus: driver.checkInStatus,
      workDays: workData?.checkIns || 0,
      totalIncome: incomeData?.totalIncome || 0,
      ticketCount: incomeData?.ticketCount || 0,
      performance: workData?.checkIns > 0 ? 'Active' : 'Inactive'
    };
  });
  
  return NextResponse.json({
    type: 'drivers',
    period: { startDate, endDate },
    summary: {
      totalDrivers: allDrivers.length,
      activeDrivers: allDrivers.filter(d => d.checkInStatus === 'checked-in').length,
      totalWorkDays: workLogs.reduce((sum, log) => sum + log.checkIns, 0),
      totalIncome: driverIncome.reduce((sum, income) => sum + income.totalIncome, 0)
    },
    drivers: driverStats
  });
}

// Route Report
async function getRouteReport(startDate: Date, endDate: Date) {
  const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
  
  // Since we don't have route model yet, we'll simulate with general stats
  const totalTrips = await Ticket.countDocuments(dateFilter);
  const avgTicketsPerTrip = totalTrips > 0 ? Math.round(totalTrips / 24) : 0; // Assuming 24 trips per day
  
  return NextResponse.json({
    type: 'routes',
    period: { startDate, endDate },
    summary: {
      totalTrips: 24, // Simulated
      averageOccupancy: '78%', // Simulated
      mostPopularRoute: 'สถานีรถไฟ - ตัวเมือง',
      averageTripTime: '42 นาที'
    },
    routes: [
      {
        name: 'สถานีรถไฟ - ตัวเมือง',
        tickets: totalTrips,
        revenue: totalTrips * 45000,
        occupancyRate: 0.78,
        avgTripTime: 42
      }
    ]
  });
}

// Financial Report
async function getFinancialReport(startDate: Date, endDate: Date) {
  const dateString = startDate.toISOString().split('T')[0];
  
  // Get revenue summary from Income model
  const revenueSummary = await Income.getDailyRevenueSummary(dateString);
  
  const totalRevenue = Object.values(revenueSummary).reduce((sum: number, item: any) => sum + item.totalAmount, 0);
  
  return NextResponse.json({
    type: 'financial',
    period: { startDate, endDate },
    summary: {
      totalRevenue,
      companyShare: revenueSummary.company.totalAmount,
      stationShare: revenueSummary.station.totalAmount,
      driverShare: revenueSummary.driver.totalAmount
    },
    breakdown: revenueSummary
  });
}

// Summary Report (Overview)
async function getSummaryReport(startDate: Date, endDate: Date) {
  const [salesData, driverData, financialData] = await Promise.all([
    getSalesReport(startDate, endDate),
    getDriverReport(startDate, endDate),
    getFinancialReport(startDate, endDate)
  ]);
  
  const salesJson = await salesData.json();
  const driverJson = await driverData.json();
  const financialJson = await financialData.json();
  
  return NextResponse.json({
    type: 'summary',
    period: { startDate, endDate },
    sales: salesJson.summary,
    drivers: driverJson.summary,
    financial: financialJson.summary,
    quickStats: {
      totalTickets: salesJson.summary.totalTickets,
      totalRevenue: salesJson.summary.totalRevenue,
      activeDrivers: driverJson.summary.activeDrivers,
      avgTicketPrice: salesJson.summary.averagePrice
    }
  });
}