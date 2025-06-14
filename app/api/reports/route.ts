// app/api/reports/route.ts - แก้ไขให้ส่งข้อมูลครบสำหรับรายงานทุกประเภท

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Car from '@/models/Car';
import CarType from '@/models/CarType';
import WorkLog from '@/models/WorkLog';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Types } from 'mongoose';

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
    
    // ตรวจสอบสิทธิ์สำหรับรายงานพนักงาน
    if (reportType === 'staff') {
      if (!['admin', 'station'].includes(session.user.role)) {
        return NextResponse.json(
          { 
            error: 'Forbidden - You do not have permission to view staff reports',
            message: 'ທ່ານບໍ່ມີສິດທິ່ເບິ່ງລາຍງານພະນັກງານ'
          }, 
          { status: 403 }
        );
      }
    }
    
    // Set default date range (today)
    const today = new Date();
    const defaultStart = startDate ? new Date(startDate + 'T00:00:00.000Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const defaultEnd = endDate ? new Date(endDate + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    console.log('Report request:', { reportType, startDate, endDate, userRole: session.user.role });
    
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
        return await getSummaryReportWithGroupTickets(defaultStart, defaultEnd);
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

// ✅ ฟังก์ชันสรุปรายงานใหม่ที่รวมข้อมูลตั๋วแบบกลุ่ม
async function getSummaryReportWithGroupTickets(startDate: Date, endDate: Date) {
  try {
    console.log('Summary Report with Group Tickets - Date range:', startDate, 'to', endDate);
    
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    
    // 1. ดึงข้อมูลตั๋วแยกตาม ticketType
    const ticketStats = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$ticketType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          totalPassengers: { $sum: { $ifNull: ['$passengerCount', 1] } }
        }
      }
    ]);

    console.log('Ticket stats by type:', ticketStats);

    // 2. จัดรูปแบบข้อมูลตั๋ว
    const ticketData = {
      individual: { count: 0, totalRevenue: 0, totalPassengers: 0 },
      group: { count: 0, totalRevenue: 0, totalPassengers: 0 }
    };

    ticketStats.forEach(stat => {
      if (stat._id === 'individual' || stat._id === 'group') {
        ticketData[stat._id] = {
          count: stat.count,
          totalRevenue: stat.totalRevenue,
          totalPassengers: stat.totalPassengers
        };
      }
    });

    // 3. คำนวณสรุปรวม
    const totalTickets = ticketData.individual.count + ticketData.group.count;
    const totalRevenue = ticketData.individual.totalRevenue + ticketData.group.totalRevenue;
    const totalPassengers = ticketData.individual.totalPassengers + ticketData.group.totalPassengers;

    // 4. ดึงข้อมูลคนขับและพนักงาน
    const [activeDrivers, totalDrivers] = await Promise.all([
      User.countDocuments({ role: 'driver', checkInStatus: 'checked-in' }),
      User.countDocuments({ role: 'driver' })
    ]);
    
    const avgTicketPrice = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;
    const avgPricePerPassenger = totalPassengers > 0 ? Math.round(totalRevenue / totalPassengers) : 0;
    
    // 5. คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driverShare = Math.round(totalRevenue * 0.85);
    
    // 6. สร้าง response ที่มีข้อมูลตั๋วแบบกลุ่ม
    const salesSummary = {
      totalTickets,
      totalRevenue,
      totalPassengers,
      averagePrice: avgTicketPrice,
      averagePricePerPassenger: avgPricePerPassenger,
      // ข้อมูลตั๋วแยกประเภท
      ticketBreakdown: {
        individual: {
          count: ticketData.individual.count,
          revenue: ticketData.individual.totalRevenue,
          passengers: ticketData.individual.totalPassengers,
          percentage: totalTickets > 0 ? Math.round((ticketData.individual.count / totalTickets) * 100) : 0
        },
        group: {
          count: ticketData.group.count,
          revenue: ticketData.group.totalRevenue,
          passengers: ticketData.group.totalPassengers,
          percentage: totalTickets > 0 ? Math.round((ticketData.group.count / totalTickets) * 100) : 0,
          averageGroupSize: ticketData.group.count > 0 ? Math.round(ticketData.group.totalPassengers / ticketData.group.count) : 0
        }
      }
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
    
    // 7. Quick stats ที่รวมข้อมูลตั๋วกลุ่ม
    const quickStats = {
      totalTickets,
      totalRevenue,
      totalPassengers,
      activeDrivers,
      avgTicketPrice,
      avgPricePerPassenger,
      // สถิติพิเศษ
      groupTicketPercentage: totalTickets > 0 ? Math.round((ticketData.group.count / totalTickets) * 100) : 0,
      individualTicketPercentage: totalTickets > 0 ? Math.round((ticketData.individual.count / totalTickets) * 100) : 0
    };
    
    console.log('Enhanced summary data prepared with group tickets:', {
      sales: salesSummary,
      quickStats,
      ticketBreakdown: salesSummary.ticketBreakdown
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
    console.error('Summary Report with Group Tickets Error:', error);
    
    return NextResponse.json({
      type: 'summary',
      period: { startDate, endDate },
      sales: {
        totalTickets: 0,
        totalRevenue: 0,
        totalPassengers: 0,
        averagePrice: 0,
        averagePricePerPassenger: 0,
        ticketBreakdown: {
          individual: { count: 0, revenue: 0, passengers: 0, percentage: 0 },
          group: { count: 0, revenue: 0, passengers: 0, percentage: 0, averageGroupSize: 0 }
        }
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
        totalPassengers: 0,
        activeDrivers: 0,
        avgTicketPrice: 0,
        avgPricePerPassenger: 0,
        groupTicketPercentage: 0,
        individualTicketPercentage: 0
      }
    });
  }
}

// ✅ รายงานยอดขาย
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

// ✅ รายงานคนขับ - ปรับปรุงให้มีข้อมูลครบ
async function getDriverReport(startDate: Date, endDate: Date) {
  try {
    console.log('📊 Driver Report - Date range:', startDate, 'to', endDate);
    
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    
    // 1. ดึงรายได้รวม
    const totalRevenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
    const driversShare = Math.round(totalRevenue * 0.85);
    
    // 2. ดึงข้อมูลคนขับทั้งหมด
    const allDrivers = await User.find({ role: 'driver' }).select('_id name employeeId checkInStatus lastCheckIn lastCheckOut');
    
    // 3. ดึงข้อมูลการทำงานจาก DriverTrip (เฉพาะที่ถึง 80% และสำเร็จ)
    const dateArray: string[] = [];
    const currentDate = new Date(startDate);
    const endDateOnly = new Date(endDate);
    
    while (currentDate <= endDateOnly) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('📅 Date array for driver report:', dateArray);
    
    // หาคนขับที่มีสิทธิ์ได้รับเงินในแต่ละวัน
    const qualifiedDriversData = await DriverTrip.aggregate([
      {
        $match: {
          date: { $in: dateArray },
          status: 'completed',
          is_80_percent_reached: true
        }
      },
      {
        $group: {
          _id: { driver_id: '$driver_id', date: '$date' },
          completed_trips: { $sum: 1 }
        }
      },
      {
        $match: {
          completed_trips: { $gte: 2 }
        }
      },
      {
        $group: {
          _id: '$_id.driver_id',
          qualified_days: { $sum: 1 },
          dates: { $addToSet: '$_id.date' }
        }
      }
    ]);
    
    console.log('👥 Qualified drivers data:', qualifiedDriversData.length, 'drivers');
    
    // 4. รวมคนขับทั้งหมดที่มีสิทธิ์
    const qualifiedDriverIds = qualifiedDriversData.map(d => d._id.toString());
    const totalQualifiedDrivers = qualifiedDriverIds.length;
    const revenuePerDriver = totalQualifiedDrivers > 0 ? Math.round(driversShare / totalQualifiedDrivers) : 0;
    
    // 5. สร้างรายการคนขับพร้อมข้อมูลรายได้
    const driversWithRevenue = allDrivers.map(driver => {
      const qualifiedData = qualifiedDriversData.find(q => q._id.toString() === driver._id.toString());
      const hasRevenue = !!qualifiedData;
      const workDays = qualifiedData?.qualified_days || 0;
      
      return {
        id: driver._id.toString(),
        name: driver.name,
        employeeId: driver.employeeId,
        checkInStatus: driver.checkInStatus || 'checked-out',
        workDays: workDays,
        totalIncome: hasRevenue ? revenuePerDriver : 0,
        performance: hasRevenue ? 'qualified' : 'not_qualified',
        lastCheckIn: driver.lastCheckIn,
        lastCheckOut: driver.lastCheckOut
      };
    });
    
    // 6. แยกคนขับที่มีสิทธิ์และไม่มีสิทธิ์
    const qualifiedDrivers = driversWithRevenue.filter(d => d.totalIncome > 0);
    const nonQualifiedDrivers = driversWithRevenue.filter(d => d.totalIncome === 0);
    
    console.log('✅ Driver report summary:', {
      totalDrivers: allDrivers.length,
      qualifiedDrivers: qualifiedDrivers.length,
      nonQualifiedDrivers: nonQualifiedDrivers.length,
      totalRevenue,
      driversShare,
      revenuePerDriver
    });
    
    return NextResponse.json({
      type: 'drivers',
      period: { startDate, endDate },
      summary: {
        totalDrivers: allDrivers.length,
        activeDrivers: allDrivers.filter(d => d.checkInStatus === 'checked-in').length,
        workingDriversInPeriod: driversWithRevenue.filter(d => d.workDays > 0).length,
        totalWorkDays: driversWithRevenue.reduce((sum, d) => sum + d.workDays, 0),
        totalIncome: driversShare,
        revenuePerDriver: revenuePerDriver
      },
      drivers: driversWithRevenue,
      metadata: {
        totalRevenue: totalRevenue,
        driverSharePercentage: 85,
        workingDriversCount: qualifiedDrivers.length,
        revenuePerDriver: revenuePerDriver,
        qualifiedDrivers: qualifiedDrivers.length,
        nonQualifiedDrivers: nonQualifiedDrivers.length
      }
    });
    
  } catch (error) {
    console.error('❌ Driver Report Error:', error);
    return NextResponse.json({
      type: 'drivers',
      period: { startDate, endDate },
      summary: {
        totalDrivers: 0,
        activeDrivers: 0,
        workingDriversInPeriod: 0,
        totalWorkDays: 0,
        totalIncome: 0,
        revenuePerDriver: 0
      },
      drivers: [],
      metadata: {
        totalRevenue: 0,
        driverSharePercentage: 85,
        workingDriversCount: 0,
        revenuePerDriver: 0,
        qualifiedDrivers: 0,
        nonQualifiedDrivers: 0
      }
    });
  }
}

async function getRouteReport(startDate: Date, endDate: Date) {
  // Implementation for route report
  return NextResponse.json({
    type: 'routes',
    period: { startDate, endDate },
    summary: {},
    routes: []
  });
}

// ✅ รายงานการเงิน
async function getFinancialReport(startDate: Date, endDate: Date) {
  const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
  const revenueResult = await Ticket.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  
  const totalRevenue = revenueResult[0]?.total || 0;
  
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

// ✅ รายงานรถ
async function getVehiclesReport(startDate: Date, endDate: Date) {
  try {
    // ดึงข้อมูลรถทั้งหมด
    const cars = await Car.find()
      .populate('user_id', 'name email employeeId checkInStatus')
      .populate('car_type_id');
    
    // ดึงข้อมูลประเภทรถ
    const carTypes = await CarType.find();
    
    // นับจำนวนรถแยกตามประเภท
    const carTypeStats = carTypes.map(type => {
      const carsOfType = cars.filter(car => car.car_type_id?.toString() === type._id.toString());
      const activeCars = carsOfType.filter(car => car.user_id?.checkInStatus === 'checked-in').length;
      
      return {
        _id: type._id,
        carType_name: type.carType_name,
        count: carsOfType.length,
        activeCars: activeCars
      };
    });
    
    // สถิติสรุป
    const totalCars = cars.length;
    const activeCars = cars.filter(car => car.user_id?.checkInStatus === 'checked-in').length;
    const driversWithCars = cars.filter(car => car.user_id).length;
    
    // จัดรูปแบบข้อมูลรถ
    const formattedCars = cars.map(car => ({
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
        totalCarTypes: carTypes.length,
        driversWithCars
      },
      carTypes: carTypeStats,
      cars: formattedCars
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

// ✅ รายงานพนักงานขายตั๋ว
async function getStaffReport(startDate: Date, endDate: Date) {
  try {
    console.log('📊 Staff Report - Date range:', startDate, 'to', endDate);
    
    const dateFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    
    // ดึงข้อมูลพนักงานขายตั๋วทั้งหมด
    const allStaff = await User.find({ role: 'staff' })
      .select('_id name employeeId checkInStatus lastCheckIn lastCheckOut');
    
    // ดึงข้อมูลตั๋วที่ขายในช่วงเวลาที่กำหนด
    const ticketsSold = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$soldBy',
          ticketCount: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);
    
    // รวมข้อมูลพนักงานกับยอดขาย
    const staffWithSales = allStaff.map(staff => {
      const salesData = ticketsSold.find(sale => 
        sale._id === staff.email || sale._id === staff.name
      );
      
      return {
        id: staff._id.toString(),
        name: staff.name,
        employeeId: staff.employeeId,
        checkInStatus: staff.checkInStatus || 'checked-out',
        lastCheckIn: staff.lastCheckIn,
        lastCheckOut: staff.lastCheckOut,
        ticketsSold: salesData?.ticketCount || 0,
        totalRevenue: salesData?.totalRevenue || 0,
        workDays: 1 // สำหรับช่วงเวลาที่เลือก
      };
    });
    
    // คำนวณสถิติ
    const totalStaff = allStaff.length;
    const activeStaff = allStaff.filter(s => s.checkInStatus === 'checked-in').length;
    const totalTicketsSold = ticketsSold.reduce((sum, sale) => sum + sale.ticketCount, 0);
    const totalWorkDays = staffWithSales.filter(s => s.ticketsSold > 0).length;
    
    console.log('✅ Staff report summary:', {
      totalStaff,
      activeStaff,
      totalTicketsSold,
      totalWorkDays
    });
    
    return NextResponse.json({
      type: 'staff',
      period: { startDate, endDate },
      summary: {
        totalStaff,
        activeStaff,
        totalTicketsSold,
        totalWorkDays,
        averageTicketsPerStaff: totalStaff > 0 ? Math.round(totalTicketsSold / totalStaff) : 0,
        topPerformerTickets: staffWithSales.length > 0 ? Math.max(...staffWithSales.map(s => s.ticketsSold)) : 0,
        averageWorkDaysPerStaff: totalStaff > 0 ? Math.round(totalWorkDays / totalStaff) : 0
      },
      staff: staffWithSales
    });
    
  } catch (error) {
    console.error('❌ Staff Report Error:', error);
    return NextResponse.json({
      type: 'staff',
      period: { startDate, endDate },
      summary: {
        totalStaff: 0,
        activeStaff: 0,
        totalTicketsSold: 0,
        totalWorkDays: 0,
        averageTicketsPerStaff: 0,
        topPerformerTickets: 0,
        averageWorkDaysPerStaff: 0
      },
      staff: []
    });
  }
}