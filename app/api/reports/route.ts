// app/api/reports/route.ts - แก้ไขส่วน Financial Report
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

// Financial Report - ปรับปรุงใหม่
async function getFinancialReport(startDate: Date, endDate: Date) {
  console.log('Financial Report - Date range:', startDate, 'to', endDate);
  
  try {
    // ดึงข้อมูลจาก Income model โดยตรง
    const incomeFilter = {
      income_date: { $gte: startDate, $lte: endDate }
    };
    
    console.log('Income filter:', incomeFilter);
    
    // ดึงข้อมูลรายได้แยกตาม revenue_share_type
    const revenueBreakdown = await Income.aggregate([
      { $match: incomeFilter },
      {
        $group: {
          _id: '$revenue_share_type',
          totalAmount: { $sum: '$income_amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Revenue breakdown result:', revenueBreakdown);
    
    // จัดรูปแบบข้อมูล
    const breakdown = {
      company: { totalAmount: 0, transactionCount: 0 },
      station: { totalAmount: 0, transactionCount: 0 },
      driver: { totalAmount: 0, transactionCount: 0 }
    };
    
    // แปลงผลลัพธ์
    revenueBreakdown.forEach(item => {
      if (item._id && breakdown[item._id as keyof typeof breakdown]) {
        breakdown[item._id as keyof typeof breakdown] = {
          totalAmount: item.totalAmount || 0,
          transactionCount: item.transactionCount || 0
        };
      }
    });
    
    // คำนวณรายได้รวม
    const totalRevenue = breakdown.company.totalAmount + breakdown.station.totalAmount + breakdown.driver.totalAmount;
    
    console.log('Final breakdown:', breakdown);
    console.log('Total revenue:', totalRevenue);
    
    // ถ้าไม่มีข้อมูลจาก Income table ให้ใช้ข้อมูลจาก Tickets
    if (totalRevenue === 0) {
      console.log('No income data found, calculating from tickets...');
      
      const ticketFilter = { soldAt: { $gte: startDate, $lte: endDate } };
      const ticketRevenue = await Ticket.aggregate([
        { $match: ticketFilter },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]);
      
      const ticketTotal = ticketRevenue[0]?.total || 0;
      console.log('Ticket total revenue:', ticketTotal);
      
      if (ticketTotal > 0) {
        // คำนวณตามสัดส่วน 10%, 5%, 85%
        breakdown.company.totalAmount = Math.round(ticketTotal * 0.10);
        breakdown.station.totalAmount = Math.round(ticketTotal * 0.05);
        breakdown.driver.totalAmount = Math.round(ticketTotal * 0.85);
      }
    }
    
    const finalTotalRevenue = breakdown.company.totalAmount + breakdown.station.totalAmount + breakdown.driver.totalAmount;
    
    return NextResponse.json({
      type: 'financial',
      period: { startDate, endDate },
      summary: {
        totalRevenue: finalTotalRevenue,
        companyShare: breakdown.company.totalAmount,
        stationShare: breakdown.station.totalAmount,
        driverShare: breakdown.driver.totalAmount
      },
      breakdown: breakdown
    });
    
  } catch (error) {
    console.error('Financial Report Error:', error);
    
    // Fallback: ใช้ข้อมูลจาก Tickets
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    const revenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    const breakdown = {
      company: { 
        totalAmount: Math.round(totalRevenue * 0.10), 
        transactionCount: 0 
      },
      station: { 
        totalAmount: Math.round(totalRevenue * 0.05), 
        transactionCount: 0 
      },
      driver: { 
        totalAmount: Math.round(totalRevenue * 0.85), 
        transactionCount: 0 
      }
    };
    
    return NextResponse.json({
      type: 'financial',
      period: { startDate, endDate },
      summary: {
        totalRevenue,
        companyShare: breakdown.company.totalAmount,
        stationShare: breakdown.station.totalAmount,
        driverShare: breakdown.driver.totalAmount
      },
      breakdown: breakdown
    });
  }
}

// Summary Report (Overview) - ปรับปรุงใหม่
async function getSummaryReport(startDate: Date, endDate: Date) {
  try {
    console.log('Summary Report - Date range:', startDate, 'to', endDate);
    
    // เรียก API แต่ละประเภทแบบ parallel
    const [salesResponse, driverResponse, financialResponse] = await Promise.all([
      getSalesReport(startDate, endDate),
      getDriverReport(startDate, endDate),
      getFinancialReport(startDate, endDate)
    ]);
    
    // แปลง Response เป็น JSON
    const salesData = await salesResponse.json();
    const driverData = await driverResponse.json();
    const financialData = await financialResponse.json();
    
    console.log('Summary - Sales data:', salesData.summary);
    console.log('Summary - Driver data:', driverData.summary);
    console.log('Summary - Financial data:', financialData.summary);
    
    return NextResponse.json({
      type: 'summary',
      period: { startDate, endDate },
      sales: salesData.summary,
      drivers: driverData.summary,
      financial: financialData.summary,
      quickStats: {
        totalTickets: salesData.summary.totalTickets,
        totalRevenue: salesData.summary.totalRevenue,
        activeDrivers: driverData.summary.activeDrivers,
        avgTicketPrice: salesData.summary.averagePrice
      }
    });
    
  } catch (error) {
    console.error('Summary Report Error:', error);
    
    // Fallback - ดึงข้อมูลพื้นฐานเท่านั้น
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    
    const basicStats = await Promise.all([
      Ticket.countDocuments(dateFilter),
      Ticket.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      User.countDocuments({ role: 'driver', checkInStatus: 'checked-in' })
    ]);
    
    const totalTickets = basicStats[0];
    const totalRevenue = basicStats[1][0]?.total || 0;
    const activeDrivers = basicStats[2];
    
    return NextResponse.json({
      type: 'summary',
      period: { startDate, endDate },
      sales: {
        totalTickets,
        totalRevenue,
        averagePrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0
      },
      drivers: {
        totalDrivers: await User.countDocuments({ role: 'driver' }),
        activeDrivers,
        totalWorkDays: 0,
        totalIncome: Math.round(totalRevenue * 0.85)
      },
      financial: {
        totalRevenue,
        companyShare: Math.round(totalRevenue * 0.10),
        stationShare: Math.round(totalRevenue * 0.05),
        driverShare: Math.round(totalRevenue * 0.85)
      },
      quickStats: {
        totalTickets,
        totalRevenue,
        activeDrivers,
        avgTicketPrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0
      }
    });
  }
}