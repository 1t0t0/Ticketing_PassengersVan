// app/api/station/income/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงรายได้ของ Station
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'station') {
      return NextResponse.json(
        { error: 'Unauthorized - Only stations can access this endpoint' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const stationId = session.user.id;

    let result;

    switch (type) {
      case 'dashboard':
        // รองรับ date range
        if (startDate && endDate) {
          result = await getStationDashboardDataRange(stationId, startDate, endDate);
        } else {
          result = await getStationDashboardData(stationId, date);
        }
        break;
        
      case 'daily':
        result = await getStationDailyIncome(stationId, date);
        break;
        
      case 'monthly':
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
        result = await getStationMonthlyIncome(stationId, year, month);
        break;
        
      case 'summary':
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        result = await getStationSummary(stationId, thirtyDaysAgo, today);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      data: result
    });

  } catch (error) {
    console.error('Station Income API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch station income data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ฟังก์ชันสำหรับ date range
async function getStationDashboardDataRange(stationId: string, startDateStr: string, endDateStr: string) {
  try {
    console.log('📊 Fetching station dashboard data range for station:', stationId, 'from:', startDateStr, 'to:', endDateStr);
    
    const startOfRange = new Date(startDateStr + 'T00:00:00.000Z');
    const endOfRange = new Date(endDateStr + 'T23:59:59.999Z');
    
    // 1. ดึงข้อมูลรายได้รวมในช่วงนี้
    const totalRevenueResult = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: startOfRange, $lte: endOfRange }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalTickets: { $sum: 1 }
        }
      }
    ]);
    
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
    const totalTickets = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalTickets : 0;
    
    // 2. ดึงข้อมูลคนขับที่เข้าทำงาน (ใช้ข้อมูลปัจจุบัน)
    const workingDriversToday = await User.countDocuments({
      role: 'driver',
      checkInStatus: 'checked-in'
    });
    
    // 3. คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driversShare = Math.round(totalRevenue * 0.85);
    
    // 4. คำนวณจำนวนวันในช่วงนี้
    const totalDays = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 5. ดึงข้อมูลสถานี
    const stationInfo = await User.findById(stationId).select('name stationName stationId location');
    
    const result = {
      station: {
        id: stationId,
        name: stationInfo?.name || 'Unknown',
        stationId: stationInfo?.stationId || 'N/A',
        stationName: stationInfo?.stationName || stationInfo?.name || 'Unknown Station',
        location: stationInfo?.location || ''
      },
      
      // เพิ่ม dateRange info
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
        totalDays: totalDays
      },
      
      totalRevenue: totalRevenue,
      totalTickets: totalTickets,
      todayRevenue: totalRevenue, // ใช้เป็น total สำหรับช่วงที่เลือก
      companyRevenue: companyShare,
      stationRevenue: stationShare,
      driverRevenue: driversShare,
      
      workingDriversCount: workingDriversToday,
      stationShare: stationShare,
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      
      chartData: {
        company: companyShare,
        station: stationShare,
        drivers: driversShare
      },
      
      calculation: {
        totalRevenue: totalRevenue,
        companyPercent: 10,
        stationPercent: 5,
        driversPercent: 85,
        stationShare: stationShare,
      }
    };
    
    console.log('✅ Station dashboard range result:', {
      totalRevenue,
      totalTickets, 
      totalDays,
      stationShare
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in getStationDashboardDataRange:', error);
    throw error;
  }
}

// ฟังก์ชันเดิม: สำหรับวันเดียว
async function getStationDashboardData(stationId: string, date: string) {
  try {
    console.log('📊 Fetching station dashboard data for station:', stationId, 'date:', date);
    
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    // รายได้รวมทั้งหมดในวันนี้
    const totalRevenueResult = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalTickets: { $sum: 1 }
        }
      }
    ]);
    
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
    const totalTickets = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalTickets : 0;
    
    // ดึงจำนวนคนขับที่เข้าทำงานวันนี้
    const workingDriversToday = await User.countDocuments({
      role: 'driver',
      checkInStatus: 'checked-in'
    });
    
    // คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driversShare = Math.round(totalRevenue * 0.85);
    
    // ดึงข้อมูลสถานี
    const stationInfo = await User.findById(stationId).select('name stationName stationId location');
    
    const result = {
      station: {
        id: stationId,
        name: stationInfo?.name || 'Unknown',
        stationId: stationInfo?.stationId || 'N/A',
        stationName: stationInfo?.stationName || stationInfo?.name || 'Unknown Station',
        location: stationInfo?.location || ''
      },
      
      totalRevenue: totalRevenue,
      totalTickets: totalTickets,
      todayRevenue: totalRevenue,
      companyRevenue: companyShare,
      stationRevenue: stationShare,
      driverRevenue: driversShare,
      
      workingDriversCount: workingDriversToday,
      stationShare: stationShare,
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      
      chartData: {
        company: companyShare,
        station: stationShare,
        drivers: driversShare
      },
      
      calculation: {
        totalRevenue: totalRevenue,
        companyPercent: 10,
        stationPercent: 5,
        driversPercent: 85,
        stationShare: stationShare,
      }
    };
    
    console.log('✅ Station dashboard result:', {
      totalRevenue,
      totalTickets,
      stationShare
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in getStationDashboardData:', error);
    throw error;
  }
}

// ฟังก์ชันสำหรับรายได้รายวัน
async function getStationDailyIncome(stationId: string, date: string) {
  try {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const result = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: startOfDay, $lte: endOfDay }
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
    
    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;
    const ticketCount = result.length > 0 ? result[0].ticketCount : 0;
    const stationShare = Math.round(totalRevenue * 0.05);
    
    return {
      date,
      totalRevenue,
      ticketCount,
      stationShare,
      stationPercent: 5
    };
    
  } catch (error) {
    console.error('❌ Error in getStationDailyIncome:', error);
    throw error;
  }
}

// ฟังก์ชันสำหรับรายได้รายเดือน
async function getStationMonthlyIncome(stationId: string, year: number, month: number) {
  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    const dailyResults = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$soldAt' },
            month: { $month: '$soldAt' },
            day: { $dayOfMonth: '$soldAt' }
          },
          date: { $first: '$soldAt' },
          totalRevenue: { $sum: '$price' },
          ticketCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.day': 1 }
      }
    ]);
    
    return dailyResults.map(item => ({
      date: item.date,
      totalRevenue: item.totalRevenue,
      ticketCount: item.ticketCount,
      stationShare: Math.round(item.totalRevenue * 0.05)
    }));
    
  } catch (error) {
    console.error('❌ Error in getStationMonthlyIncome:', error);
    throw error;
  }
}

// ฟังก์ชันสำหรับสรุปข้อมูล
async function getStationSummary(stationId: string, startDate: Date, endDate: Date) {
  try {
    const summaryResult = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalTickets: { $sum: 1 },
          avgTicketPrice: { $avg: '$price' },
          maxDailyRevenue: { $max: '$price' },
          minDailyRevenue: { $min: '$price' }
        }
      }
    ]);
    
    if (summaryResult.length === 0) {
      return {
        totalRevenue: 0,
        totalTickets: 0,
        stationShare: 0,
        avgTicketPrice: 0,
        maxDailyRevenue: 0,
        minDailyRevenue: 0
      };
    }
    
    const data = summaryResult[0];
    const stationShare = Math.round(data.totalRevenue * 0.05);
    
    return {
      totalRevenue: data.totalRevenue,
      totalTickets: data.totalTickets,
      stationShare: stationShare,
      avgTicketPrice: Math.round(data.avgTicketPrice),
      maxDailyRevenue: data.maxDailyRevenue,
      minDailyRevenue: data.minDailyRevenue
    };
    
  } catch (error) {
    console.error('❌ Error in getStationSummary:', error);
    throw error;
  }
}