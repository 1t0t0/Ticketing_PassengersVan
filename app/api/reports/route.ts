// app/api/reports/route.ts - เพิ่มรายงานรถและพนักงาน

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Car from '@/models/Car';
import CarType from '@/models/CarType';
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
      case 'vehicles':
        return await getVehiclesReport(defaultStart, defaultEnd);
      case 'staff':
        return await getStaffReport(defaultStart, defaultEnd);
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

// เพิ่มฟังก์ชันรายงานรถ
async function getVehiclesReport(startDate: Date, endDate: Date) {
  console.log('Vehicles Report - Date range:', startDate, 'to', endDate);
  
  try {
    // ดึงข้อมูลรถทั้งหมด
    const allCars = await Car.find()
      .populate('user_id', 'name employeeId checkInStatus')
      .populate('car_type_id', 'carType_name');

    // ดึงข้อมูลประเภทรถทั้งหมด
    const allCarTypes = await CarType.find();

    // คำนวณสถิติ
    const totalCars = allCars.length;
    const activeCars = allCars.filter(car => 
      car.user_id && car.user_id.checkInStatus === 'checked-in'
    ).length;
    const driversWithCars = allCars.filter(car => car.user_id).length;

    // สรุปประเภทรถ
    const carTypesStats = allCarTypes.map(type => {
      const carsOfType = allCars.filter(car => 
        car.car_type_id && car.car_type_id._id.toString() === type._id.toString()
      );
      const activeCarsOfType = carsOfType.filter(car => 
        car.user_id && car.user_id.checkInStatus === 'checked-in'
      );

      return {
        _id: type._id,
        carType_name: type.carType_name,
        count: carsOfType.length,
        activeCars: activeCarsOfType.length
      };
    });

    // เตรียมข้อมูลรถสำหรับตาราง (แปลง populate data)
    const carsData = allCars.map(car => ({
      _id: car._id,
      car_id: car.car_id,
      car_name: car.car_name,
      car_registration: car.car_registration,
      car_capacity: car.car_capacity,
      carType: car.car_type_id ? {
        carType_name: car.car_type_id.carType_name
      } : null,
      user_id: car.user_id ? {
        name: car.user_id.name,
        employeeId: car.user_id.employeeId,
        checkInStatus: car.user_id.checkInStatus
      } : null
    }));

    return NextResponse.json({
      type: 'vehicles',
      period: { startDate, endDate },
      summary: {
        totalCars,
        activeCars,
        totalCarTypes: allCarTypes.length,
        driversWithCars
      },
      carTypes: carTypesStats,
      cars: carsData
    });

  } catch (error) {
    console.error('Vehicles Report Error:', error);
    return NextResponse.json({
      type: 'vehicles',
      period: { startDate, endDate },
      summary: {
        totalCars: 0,
        activeCars: 0,
        totalCarTypes: 0,
        driversWithCars: 0
      },
      carTypes: [],
      cars: []
    });
  }
}

// เพิ่มฟังก์ชันรายงานพนักงาน
async function getStaffReport(startDate: Date, endDate: Date) {
  console.log('Staff Report - Date range:', startDate, 'to', endDate);
  
  try {
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    
    // ดึงข้อมูลพนักงานทั้งหมด (staff + admin)
    const allStaff = await User.find({ 
      role: { $in: ['staff', 'admin'] } 
    }).select('name employeeId checkInStatus lastCheckIn lastCheckOut');

    // หาปี้ที่ขายโดยพนักงานแต่ละคน (ในช่วงเวลาที่เลือก)
    const ticketsByStaff = await Ticket.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$soldBy',
          ticketsSold: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    // รวมข้อมูลพนักงานกับยอดขาย
    const staffWithSales = allStaff.map(staff => {
      const salesData = ticketsByStaff.find(ticket => 
        ticket._id && ticket._id.toString() === staff._id.toString()
      );

      // คำนวณชั่วโมงทำงาน (ประมาณการจาก check-in/out)
      let workHours = 0;
      if (staff.lastCheckIn && staff.lastCheckOut) {
        const checkIn = new Date(staff.lastCheckIn);
        const checkOut = new Date(staff.lastCheckOut);
        if (checkOut > checkIn) {
          workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        }
      } else if (staff.checkInStatus === 'checked-in' && staff.lastCheckIn) {
        // ยังไม่ check out - คำนวณจากเวลาปัจจุบัน
        const checkIn = new Date(staff.lastCheckIn);
        const now = new Date();
        workHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }

      return {
        id: staff._id,
        name: staff.name,
        employeeId: staff.employeeId,
        checkInStatus: staff.checkInStatus,
        lastCheckIn: staff.lastCheckIn,
        lastCheckOut: staff.lastCheckOut,
        ticketsSold: salesData?.ticketsSold || 0,
        totalRevenue: salesData?.totalRevenue || 0,
        workHours: Math.max(0, Math.round(workHours * 10) / 10) // ปัดเศษ 1 ตำแหน่ง
      };
    });

    // เรียงลำดับตามยอดขาย
    staffWithSales.sort((a, b) => b.ticketsSold - a.ticketsSold);

    // คำนวณสถิติรวม
    const totalStaff = allStaff.length;
    const activeStaff = allStaff.filter(s => s.checkInStatus === 'checked-in').length;
    const totalTicketsSold = ticketsByStaff.reduce((sum, t) => sum + t.ticketsSold, 0);
    const totalWorkHours = staffWithSales.reduce((sum, s) => sum + s.workHours, 0);
    const averageTicketsPerStaff = totalStaff > 0 ? Math.round(totalTicketsSold / totalStaff) : 0;
    const topPerformerTickets = staffWithSales.length > 0 ? staffWithSales[0].ticketsSold : 0;
    const averageWorkHours = totalStaff > 0 ? totalWorkHours / totalStaff : 0;

    // สร้างข้อมูลการขายตามชั่วโมง
    const hourlySales = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $hour: '$soldAt' },
          ticketCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const workHoursData = Array.from({ length: 24 }, (_, hour) => {
      const hourData = hourlySales.find(h => h._id === hour);
      return {
        hour,
        ticketCount: hourData?.ticketCount || 0
      };
    });

    return NextResponse.json({
      type: 'staff',
      period: { startDate, endDate },
      summary: {
        totalStaff,
        activeStaff,
        totalTicketsSold,
        totalWorkHours: Math.round(totalWorkHours),
        averageTicketsPerStaff,
        topPerformerTickets,
        averageWorkHours
      },
      staff: staffWithSales,
      workHours: workHoursData
    });

  } catch (error) {
    console.error('Staff Report Error:', error);
    return NextResponse.json({
      type: 'staff',
      period: { startDate, endDate },
      summary: {
        totalStaff: 0,
        activeStaff: 0,
        totalTicketsSold: 0,
        totalWorkHours: 0,
        averageTicketsPerStaff: 0,
        topPerformerTickets: 0,
        averageWorkHours: 0
      },
      staff: [],
      workHours: []
    });
  }
}

// Sales Report (เดิม)
async function getSalesReport(startDate: Date, endDate: Date) {
  const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
  
  const totalTickets = await Ticket.countDocuments(dateFilter);
  const revenueResult = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;
  
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

// Driver Report (เดิม - ตัดให้สั้นลง)
async function getDriverReport(startDate: Date, endDate: Date) {
  console.log('Driver Report - Date range:', startDate, 'to', endDate);
  
  try {
    const allDrivers = await User.find({ role: 'driver' })
      .select('name employeeId checkInStatus');
    
    const dateArray = [];
    let currentDate = new Date(startDate);
    const endDateOnly = new Date(endDate);
    
    while (currentDate <= endDateOnly) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const dailyRevenueAndDrivers = await Promise.all(
      dateArray.map(async (dateString) => {
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
        const driverShareTotal = Math.round(dayRevenue * 0.85);
        const revenuePerDriver = workingDriversCount > 0 
          ? Math.round(driverShareTotal / workingDriversCount) 
          : 0;
        
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
    
    const driverIncomeMap = new Map();
    let totalRevenue = 0;
    let totalWorkDays = 0;
    let totalWorkingDriversInPeriod = new Set();
    
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
    
    dailyRevenueAndDrivers.forEach(dayData => {
      totalRevenue += dayData.totalRevenue;
      
      if (dayData.workingDriversCount > 0) {
        totalWorkDays += dayData.workingDriversCount;
        
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
    
    const driverStats = Array.from(driverIncomeMap.values()).sort((a, b) => b.totalIncome - a.totalIncome);
    
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
        dailyBreakdown: dailyRevenueAndDrivers
      }
    });
    
  } catch (error) {
    console.error('Driver Report Error:', error);
    
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

// Route Report (เดิม)
async function getRouteReport(startDate: Date, endDate: Date) {
  const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
  
  const totalTrips = await Ticket.countDocuments(dateFilter);
  
  return NextResponse.json({
    type: 'routes',
    period: { startDate, endDate },
    summary: {
      totalTrips: 24,
      averageOccupancy: '78%',
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

// Financial Report (เดิม)
async function getFinancialReport(startDate: Date, endDate: Date) {
  console.log('Financial Report - Date range:', startDate, 'to', endDate);
  
  try {
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    const revenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    console.log('Total revenue from tickets:', totalRevenue);
    
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

// Summary Report (เดิม)
async function getSummaryReport(startDate: Date, endDate: Date) {
  try {
    console.log('Summary Report - Date range:', startDate, 'to', endDate);
    
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