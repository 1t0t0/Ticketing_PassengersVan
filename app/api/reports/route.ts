// app/api/reports/route.ts - แก้ไขการคำนวณรายได้ Driver ย้อนหลัง

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
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

// แก้ไข Driver Report - คำนวณรายได้ตามจำนวน driver ที่เข้าทำงานในแต่ละวัน
async function getDriverReport(startDate: Date, endDate: Date) {
  console.log('Driver Report - Date range:', startDate, 'to', endDate);
  
  try {
    // 1. ดึงข้อมูลคนขับทั้งหมด
    const allDrivers = await User.find({ role: 'driver' })
      .select('name employeeId checkInStatus');
    
    console.log('Total drivers found:', allDrivers.length);
    
    // 2. สร้าง array ของวันที่ในช่วงที่เลือก
    const dateArray = [];
    let currentDate = new Date(startDate);
    const endDateOnly = new Date(endDate);
    
    while (currentDate <= endDateOnly) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('Date range array:', dateArray);
    
    // 3. คำนวณรายได้และรายได้ต่อคนสำหรับแต่ละวัน
    const dailyRevenueAndDrivers = await Promise.all(
      dateArray.map(async (dateString) => {
        // ดึงรายได้ของวันนั้น
        const dayStart = new Date(dateString + 'T00:00:00.000Z');
        const dayEnd = new Date(dateString + 'T23:59:59.999Z');
        
        const ticketRevenueResult = await Ticket.aggregate([
          {
            $match: {
              soldAt: { $gte: dayStart, $lte: dayEnd }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$price' },
              ticketCount: { $sum: 1 }
            }
          }
        ]);
        
        const dayRevenue = ticketRevenueResult[0]?.totalRevenue || 0;
        const ticketCount = ticketRevenueResult[0]?.ticketCount || 0;
        
        // หาคนขับที่เข้าทำงานในวันนั้น (จาก WorkLog)
        const workingDriversInDay = await WorkLog.aggregate([
          {
            $match: {
              date: dateString,
              action: 'check-in'
            }
          },
          {
            $group: {
              _id: '$user_id'
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
              'driver.role': 'driver'
            }
          },
          {
            $project: {
              driverId: '$_id',
              name: '$driver.name',
              employeeId: '$driver.employeeId'
            }
          }
        ]);
        
        const workingDriversCount = workingDriversInDay.length;
        const driverShareTotal = Math.round(dayRevenue * 0.85); // 85% สำหรับคนขับ
        const revenuePerDriver = workingDriversCount > 0 
          ? Math.round(driverShareTotal / workingDriversCount) 
          : 0;
        
        console.log(`Date ${dateString}: Revenue=${dayRevenue}, Drivers=${workingDriversCount}, PerDriver=${revenuePerDriver}`);
        
        return {
          date: dateString,
          totalRevenue: dayRevenue,
          ticketCount: ticketCount,
          workingDrivers: workingDriversInDay,
          workingDriversCount: workingDriversCount,
          driverShareTotal: driverShareTotal,
          revenuePerDriver: revenuePerDriver
        };
      })
    );
    
    // 4. รวมข้อมูลและคำนวณรายได้รวมต่อคนขับ
    const driverIncomeMap = new Map();
    let totalRevenue = 0;
    let totalWorkDays = 0;
    let totalWorkingDriversInPeriod = new Set();
    
    // เริ่มต้นด้วยคนขับทั้งหมด
    allDrivers.forEach(driver => {
      driverIncomeMap.set(driver._id.toString(), {
        id: driver._id,
        name: driver.name,
        employeeId: driver.employeeId,
        checkInStatus: driver.checkInStatus,
        workDays: 0,
        totalIncome: 0,
        performance: 'Inactive'
      });
    });
    
    // คำนวณรายได้จากแต่ละวัน
    dailyRevenueAndDrivers.forEach(dayData => {
      totalRevenue += dayData.totalRevenue;
      
      if (dayData.workingDriversCount > 0) {
        totalWorkDays += dayData.workingDriversCount; // นับจำนวนวัน-คน
        
        dayData.workingDrivers.forEach(driver => {
          const driverId = driver.driverId.toString();
          totalWorkingDriversInPeriod.add(driverId);
          
          if (driverIncomeMap.has(driverId)) {
            const existing = driverIncomeMap.get(driverId);
            existing.workDays += 1;
            existing.totalIncome += dayData.revenuePerDriver;
            existing.performance = 'Active';
            driverIncomeMap.set(driverId, existing);
          }
        });
      }
    });
    
    // 5. แปลงเป็น array และเรียงลำดับ
    const driverStats = Array.from(driverIncomeMap.values()).sort((a, b) => b.totalIncome - a.totalIncome);
    
    // 6. คำนวณสถิติรวม
    const totalDrivenShareForPeriod = Math.round(totalRevenue * 0.85);
    const averageRevenuePerDriver = totalWorkingDriversInPeriod.size > 0 
      ? Math.round(totalDrivenShareForPeriod / totalWorkingDriversInPeriod.size)
      : 0;
    
    const summary = {
      totalDrivers: allDrivers.length,
      activeDrivers: allDrivers.filter(d => d.checkInStatus === 'checked-in').length,
      workingDriversInPeriod: totalWorkingDriversInPeriod.size,
      totalWorkDays: totalWorkDays,
      totalIncome: totalDrivenShareForPeriod,
      revenuePerDriver: averageRevenuePerDriver
    };
    
    console.log('Final summary:', summary);
    
    return NextResponse.json({
      type: 'drivers',
      period: { startDate, endDate },
      summary: summary,
      drivers: driverStats,
      metadata: {
        totalRevenue: totalRevenue,
        driverSharePercentage: 85,
        workingDriversCount: totalWorkingDriversInPeriod.size,
        revenuePerDriver: averageRevenuePerDriver,
        dailyBreakdown: dailyRevenueAndDrivers // เพิ่มข้อมูลรายละเอียดรายวัน
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