// app/api/reports/route.ts - แก้ไขให้ใช้ฟังก์ชัน getSummaryReportWithGroupTickets

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Car from '@/models/Car';
import CarType from '@/models/CarType';
import WorkLog from '@/models/WorkLog';
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

// ✅ รายงานอื่นๆ ที่เหมือนเดิม
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

async function getDriverReport(startDate: Date, endDate: Date) {
  // Implementation for driver report
  return NextResponse.json({
    type: 'drivers',
    period: { startDate, endDate },
    summary: {},
    drivers: []
  });
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

async function getVehiclesReport(startDate: Date, endDate: Date) {
  // Implementation for vehicles report
  return NextResponse.json({
    type: 'vehicles',
    period: { startDate, endDate },
    summary: {},
    cars: [],
    carTypes: []
  });
}

async function getStaffReport(startDate: Date, endDate: Date) {
  // Implementation for staff report
  return NextResponse.json({
    type: 'staff',
    period: { startDate, endDate },
    summary: {},
    staff: []
  });
}