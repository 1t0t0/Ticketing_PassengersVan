// app/api/reports/route.ts - แก้ไขให้สมบูรณ์

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Income from '@/models/Income';
import WorkLog from '@/models/WorkLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
  
  return NextResponse.json({
    type: 'sales',
    period: { startDate, endDate },
    summary: {
      totalTickets,
      totalRevenue,
      averagePrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0
    },
    paymentMethods: paymentStats,
    hourlySales: hourlySales
  });
}

// Driver Report - ใหม่
async function getDriverReport(startDate: Date, endDate: Date) {
  console.log('Driver Report - Date range:', startDate, 'to', endDate);
  
  try {
    // 1. ดึงข้อมูลคนขับทั้งหมด
    const allDrivers = await User.find({ role: 'driver' })
      .select('name employeeId checkInStatus');
    
    console.log('Total drivers found:', allDrivers.length);
    
    // 2. คำนวณรายได้รวมจากตั๋วในช่วงวันที่
    const ticketFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    const totalRevenueResult = await Ticket.aggregate([
      { $match: ticketFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const driverShareTotal = Math.round(totalRevenue * 0.85); // 85% สำหรับคนขับทั้งหมด
    
    console.log('Total revenue:', totalRevenue);
    console.log('Driver share total (85%):', driverShareTotal);
    
    // 3. หาคนขับที่เข้าทำงานในช่วงวันที่นี้
    const dateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // ดึงรายชื่อคนขับที่มี work log ในช่วงนี้
    const workingDriversResult = await WorkLog.aggregate([
      {
        $match: {
          date: { $gte: dateString, $lte: endDateString },
          action: 'check-in' // เฉพาะการ check-in
        }
      },
      {
        $group: {
          _id: '$user_id',
          checkInDays: { $addToSet: '$date' }, // วันที่ check-in (unique)
          totalCheckIns: { $sum: 1 }
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
      },
      {
        $match: {
          'driver.role': 'driver' // ให้แน่ใจว่าเป็นคนขับ
        }
      }
    ]);
    
    const workingDriverIds = workingDriversResult.map(item => item._id.toString());
    const workingDriversCount = workingDriversResult.length;
    
    console.log('Working drivers count:', workingDriversCount);
    
    // 4. คำนวณรายรับต่อคนขับ
    const revenuePerDriver = workingDriversCount > 0 
      ? Math.round(driverShareTotal / workingDriversCount) 
      : 0;
    
    console.log('Revenue per driver:', revenuePerDriver);
    
    // 5. สร้างข้อมูลคนขับแต่ละคน
    const driverStats = allDrivers.map(driver => {
      const isWorking = workingDriverIds.includes(driver._id.toString());
      const workData = workingDriversResult.find(
        item => item._id.toString() === driver._id.toString()
      );
      
      return {
        id: driver._id,
        name: driver.name,
        employeeId: driver.employeeId,
        checkInStatus: driver.checkInStatus,
        workDays: workData ? workData.checkInDays.length : 0, // จำนวนวันที่ทำงาน
        totalIncome: isWorking ? revenuePerDriver : 0, // รายรับเฉพาะคนที่ทำงาน
        performance: isWorking ? 'Active' : 'Inactive'
      };
    });
    
    // 6. เรียงลำดับตาม totalIncome สูงสุดก่อน
    driverStats.sort((a, b) => b.totalIncome - a.totalIncome);
    
    // 7. คำนวณสถิติรวม
    const totalWorkDays = workingDriversResult.reduce(
      (sum, item) => sum + item.checkInDays.length, 
      0
    );
    
    const summary = {
      totalDrivers: allDrivers.length,
      activeDrivers: allDrivers.filter(d => d.checkInStatus === 'checked-in').length,
      workingDriversInPeriod: workingDriversCount, // เพิ่มข้อมูลนี้
      totalWorkDays: totalWorkDays,
      totalIncome: driverShareTotal,
      revenuePerDriver: revenuePerDriver
    };
    
    return NextResponse.json({
      type: 'drivers',
      period: { startDate, endDate },
      summary: summary,
      drivers: driverStats,
      metadata: {
        totalRevenue: totalRevenue,
        driverSharePercentage: 85,
        workingDriversCount: workingDriversCount,
        revenuePerDriver: revenuePerDriver
      }
    });
    
  } catch (error) {
    console.error('Driver Report Error:', error);
    
    // Fallback - ข้อมูลพื้นฐาน
    const allDrivers = await User.find({ role: 'driver' })
      .select('name employeeId checkInStatus');
    
    const basicStats = allDrivers.map(driver => ({
      id: driver._id,
      name: driver.name,
      employeeId: driver.employeeId,
      checkInStatus: driver.checkInStatus,
      workDays: 0,
      totalIncome: 0,
      performance: 'Inactive'
    }));
    
    return NextResponse.json({
      type: 'drivers',
      period: { startDate, endDate },
      summary: {
        totalDrivers: allDrivers.length,
        activeDrivers: allDrivers.filter(d => d.checkInStatus === 'checked-in').length,
        workingDriversInPeriod: 0,
        totalWorkDays: 0,
        totalIncome: 0,
        revenuePerDriver: 0
      },
      drivers: basicStats,
      metadata: {
        totalRevenue: 0,
        driverSharePercentage: 85,
        workingDriversCount: 0,
        revenuePerDriver: 0
      }
    });
  }
}

// Route Report
async function getRouteReport(startDate: Date, endDate: Date) {
  const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
  
  const totalTrips = await Ticket.countDocuments(dateFilter);
  
  return NextResponse.json({
    type: 'routes',
    period: { startDate, endDate },
    summary: {
      totalTrips: 24, // Simulated
      averageOccupancy: '78%', // Simulated
      mostPopularRoute: 'ສະຖານີລົດໄຟ - ຕົວເມືອງ',
      averageTripTime: '42 ນາທີ'
    },
    routes: [
      {
        name: 'ສະຖານີລົດໄຟ - ຕົວເມືອງ',
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
  console.log('Financial Report - Date range:', startDate, 'to', endDate);
  
  try {
    // ดึงข้อมูลจาก Tickets เป็นหลัก
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    const revenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    console.log('Total revenue from tickets:', totalRevenue);
    
    // คำนวณตามสัดส่วน
    const breakdown = {
      company: { 
        totalAmount: Math.round(totalRevenue * 0.10), 
        transactionCount: totalRevenue > 0 ? 1 : 0 
      },
      station: { 
        totalAmount: Math.round(totalRevenue * 0.05), 
        transactionCount: totalRevenue > 0 ? 1 : 0 
      },
      driver: { 
        totalAmount: Math.round(totalRevenue * 0.85), 
        transactionCount: totalRevenue > 0 ? 1 : 0 
      }
    };
    
    console.log('Financial breakdown:', breakdown);
    
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
    
  } catch (error) {
    console.error('Financial Report Error:', error);
    
    return NextResponse.json({
      type: 'financial',
      period: { startDate, endDate },
      summary: {
        totalRevenue: 0,
        companyShare: 0,
        stationShare: 0,
        driverShare: 0
      },
      breakdown: {
        company: { totalAmount: 0, transactionCount: 0 },
        station: { totalAmount: 0, transactionCount: 0 },
        driver: { totalAmount: 0, transactionCount: 0 }
      }
    });
  }
}

// Summary Report
async function getSummaryReport(startDate: Date, endDate: Date) {
  try {
    console.log('Summary Report - Date range:', startDate, 'to', endDate);
    
    // ดึงข้อมูลพื้นฐาน
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    
    const [totalTickets, revenueResult, activeDrivers, totalDrivers] = await Promise.all([
      Ticket.countDocuments(dateFilter),
      Ticket.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      User.countDocuments({ role: 'driver', checkInStatus: 'checked-in' }),
      User.countDocuments({ role: 'driver' })
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    const avgTicketPrice = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;
    
    // คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driverShare = Math.round(totalRevenue * 0.85);
    
    const salesSummary = {
      totalTickets,
      totalRevenue,
      averagePrice: avgTicketPrice
    };
    
    const driversSummary = {
      totalDrivers,
      activeDrivers,
      totalWorkDays: 0,
      totalIncome: driverShare
    };
    
    const financialSummary = {
      totalRevenue,
      companyShare,
      stationShare,
      driverShare
    };
    
    const quickStats = {
      totalTickets,
      totalRevenue,
      activeDrivers,
      avgTicketPrice
    };
    
    console.log('Summary data prepared:', {
      sales: salesSummary,
      drivers: driversSummary,
      financial: financialSummary,
      quickStats
    });
    
    return NextResponse.json({
      type: 'summary',
      period: { startDate, endDate },
      sales: salesSummary,
      drivers: driversSummary,
      financial: financialSummary,
      quickStats: quickStats
    });
    
  } catch (error) {
    console.error('Summary Report Error:', error);
    
    // Fallback ข้อมูลว่าง
    return NextResponse.json({
      type: 'summary',
      period: { startDate, endDate },
      sales: {
        totalTickets: 0,
        totalRevenue: 0,
        averagePrice: 0
      },
      drivers: {
        totalDrivers: 0,
        activeDrivers: 0,
        totalWorkDays: 0,
        totalIncome: 0
      },
      financial: {
        totalRevenue: 0,
        companyShare: 0,
        stationShare: 0,
        driverShare: 0
      },
      quickStats: {
        totalTickets: 0,
        totalRevenue: 0,
        activeDrivers: 0,
        avgTicketPrice: 0
      }
    });
  }
}

