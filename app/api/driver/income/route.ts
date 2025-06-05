// app/api/driver/income/route.ts - แก้ไขให้แสดงรายได้ต่อคนไม่ว่าสถานะอะไร
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงรายได้ของ Driver
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can access this endpoint' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const driverId = session.user.id;

    let result;

    switch (type) {
      case 'dashboard':
        // รองรับ date range
        if (startDate && endDate) {
          result = await getDashboardDataRange(driverId, startDate, endDate);
        } else {
          result = await getDashboardData(driverId, date);
        }
        break;
        
      case 'daily':
        result = await getDailyIncome(driverId, date);
        break;
        
      case 'monthly':
        result = await getMonthlyIncome(driverId, year, month);
        break;
        
      case 'summary':
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        result = await getSummaryIncome(driverId, thirtyDaysAgo, today);
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
    console.error('Driver Income API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch driver income data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ ฟังก์ชันใหม่: รองรับ date range
async function getDashboardDataRange(driverId: string, startDateStr: string, endDateStr: string) {
  try {
    console.log('📊 Fetching dashboard data range for driver:', driverId, 'from:', startDateStr, 'to:', endDateStr);
    
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
    
    // 2. ✅ แก้ไข: ดึงข้อมูลคนขับทั้งหมดที่มี role = 'driver' (ไม่ขึ้นกับสถานะ check-in)
    const allDrivers = await User.countDocuments({
      role: 'driver'
    });
    
    // ✅ แก้ไข: ถ้าไม่มีข้อมูลการขายในช่วงนี้ ให้ใช้จำนวนคนขับทั้งหมด
    // แต่ถ้ามีข้อมูลการขาย ให้ดูว่ามีคนขับกี่คนที่เข้าทำงานจริงๆ ในช่วงนั้น
    let workingDriversInPeriod = allDrivers;
    
    if (totalRevenue > 0) {
      // หาจำนวนคนขับที่เข้าทำงานจริงๆ ในช่วงเวลานี้
      // โดยดูจากข้อมูลการขายว่ามีการขายเมื่อไหร่
      const soldDates = await Ticket.distinct('soldAt', {
        soldAt: { $gte: startOfRange, $lte: endOfRange }
      });
      
      if (soldDates.length > 0) {
        // ใช้จำนวนคนขับที่เข้าทำงานในวันแรกที่มีการขาย
        const firstSaleDate = new Date(Math.min(...soldDates.map(d => new Date(d).getTime())));
        const firstSaleDateStart = new Date(firstSaleDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
        const firstSaleDateEnd = new Date(firstSaleDate.toISOString().split('T')[0] + 'T23:59:59.999Z');
        
        // หาคนขับที่ check-in ในวันแรกที่มีการขาย
        const workingDriversOnFirstSale = await User.countDocuments({
          role: 'driver',
          $or: [
            { checkInStatus: 'checked-in' }, // คนขับที่ check-in อยู่
            { 
              lastCheckIn: { 
                $gte: firstSaleDateStart, 
                $lte: firstSaleDateEnd 
              } 
            } // คนขับที่ check-in ในวันนั้น
          ]
        });
        
        workingDriversInPeriod = Math.max(workingDriversOnFirstSale, 1); // อย่างน้อย 1 คน
      }
    }
    
    console.log(`💡 Working drivers calculation: Total drivers = ${allDrivers}, Working in period = ${workingDriversInPeriod}`);
    
    // 3. คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driversShare = Math.round(totalRevenue * 0.85);
    
    // 4. ✅ แก้ไข: คำนวณส่วนแบ่งของคนขับคนนี้ (ไม่ขึ้นกับสถานะ check-in ปัจจุบัน)
    const myCalculatedShare = workingDriversInPeriod > 0 
      ? Math.round(driversShare / workingDriversInPeriod) 
      : 0;
    
    // 5. คำนวณจำนวนวันในช่วงนี้
    const totalDays = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 6. ดึงข้อมูลผู้ใช้
    const driverInfo = await User.findById(driverId).select('name employeeId checkInStatus');
    
    const result = {
      driver: {
        id: driverId,
        name: driverInfo?.name || 'Unknown',
        employeeId: driverInfo?.employeeId || 'N/A',
        checkInStatus: driverInfo?.checkInStatus || 'checked-out'
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
      
      workingDriversCount: workingDriversInPeriod,
      myDailyIncome: myCalculatedShare,
      myExpectedShare: myCalculatedShare, // ✅ แสดงเสมอไม่ว่าสถานะอะไร
      myTicketsCount: Math.round(totalTickets / Math.max(workingDriversInPeriod, 1)),
      
      monthlyIncome: myCalculatedShare, // ใช้เป็นรายได้ช่วงที่เลือก
      monthlyDays: totalDays,
      
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      averageDriverShare: workingDriversInPeriod > 0 ? Math.round(driversShare / workingDriversInPeriod) : 0,
      
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
        workingDrivers: workingDriversInPeriod,
        sharePerDriver: myCalculatedShare,
        method: 'calculated_regardless_of_checkin_status'
      }
    };
    
    console.log('✅ Dashboard range result:', {
      totalRevenue,
      totalTickets, 
      totalDays,
      myShare: myCalculatedShare,
      driverStatus: driverInfo?.checkInStatus,
      workingDrivers: workingDriversInPeriod
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in getDashboardDataRange:', error);
    throw error;
  }
}

// ✅ แก้ไขฟังก์ชันเดิม: สำหรับวันเดียว
async function getDashboardData(driverId: string, date: string) {
  try {
    console.log('📊 Fetching dashboard data for driver:', driverId, 'date:', date);
    
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
    
    // ✅ แก้ไข: หาจำนวนคนขับที่ควรจะแบ่งรายได้ (ไม่ขึ้นกับสถานะปัจจุบัน)
    let workingDriversToday;
    
    if (totalRevenue > 0) {
      // ถ้ามีรายได้ ให้หาคนขับที่เข้าทำงานในวันนั้นจริงๆ
      workingDriversToday = await User.countDocuments({
        role: 'driver',
        $or: [
          { checkInStatus: 'checked-in' }, // คนขับที่ check-in อยู่
          { 
            lastCheckIn: { 
              $gte: startOfDay, 
              $lte: endOfDay 
            } 
          } // คนขับที่ check-in ในวันนั้น
        ]
      });
      
      // ถ้าไม่พบคนขับที่ check-in ในวันนั้น ให้ใช้คนขับทั้งหมด
      if (workingDriversToday === 0) {
        workingDriversToday = await User.countDocuments({ role: 'driver' });
      }
    } else {
      // ถ้าไม่มีรายได้ ให้ใช้คนขับทั้งหมด
      workingDriversToday = await User.countDocuments({ role: 'driver' });
    }
    
    workingDriversToday = Math.max(workingDriversToday, 1); // อย่างน้อย 1 คน
    
    console.log(`💡 Working drivers today: ${workingDriversToday} drivers`);
    
    // คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driversShare = Math.round(totalRevenue * 0.85);
    
    // ✅ แก้ไข: คำนวณส่วนแบ่งของคนขับคนนี้ (แสดงเสมอ)
    const myShare = workingDriversToday > 0 
      ? Math.round(driversShare / workingDriversToday) 
      : 0;
    
    // คำนวณจำนวนตั๋วประมาณของคนขับคนนี้
    const myTicketsCount = workingDriversToday > 0 
      ? Math.round(totalTickets / workingDriversToday)
      : 0;
    
    // ดึงข้อมูลรายได้เดือนนี้ (30 วันที่ผ่านมา)
    const oneMonthAgo = new Date(startOfDay);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    const monthlyRevenueResult = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: oneMonthAgo, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          monthlyRevenue: { $sum: '$price' },
          monthlyTickets: { $sum: 1 }
        }
      }
    ]);
    
    const monthlyTotalRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].monthlyRevenue : 0;
    const monthlyDriversShare = Math.round(monthlyTotalRevenue * 0.85);
    
    // สำหรับรายได้เดือน ใช้จำนวนคนขับทั้งหมด
    const totalDriversForMonthly = await User.countDocuments({ role: 'driver' });
    const monthlyMyShare = totalDriversForMonthly > 0 
      ? Math.round(monthlyDriversShare / totalDriversForMonthly)
      : 0;
    
    const daysInMonth = 30; // ใช้ 30 วันคงที่
    
    // ดึงข้อมูลผู้ใช้
    const driverInfo = await User.findById(driverId).select('name employeeId checkInStatus');
    
    const result = {
      driver: {
        id: driverId,
        name: driverInfo?.name || 'Unknown',
        employeeId: driverInfo?.employeeId || 'N/A',
        checkInStatus: driverInfo?.checkInStatus || 'checked-out'
      },
      
      totalRevenue: totalRevenue,
      totalTickets: totalTickets,
      todayRevenue: totalRevenue,
      companyRevenue: companyShare,
      stationRevenue: stationShare,
      driverRevenue: driversShare,
      
      workingDriversCount: workingDriversToday,
      myDailyIncome: myShare,
      myExpectedShare: myShare, // ✅ แสดงเสมอไม่ว่าสถานะอะไร
      myTicketsCount: myTicketsCount,
      
      monthlyIncome: monthlyMyShare,
      monthlyDays: daysInMonth,
      
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      averageDriverShare: workingDriversToday > 0 ? Math.round(driversShare / workingDriversToday) : 0,
      
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
        workingDrivers: workingDriversToday,
        sharePerDriver: myShare,
        method: 'calculated_regardless_of_checkin_status'
      }
    };
    
    console.log('✅ Dashboard result:', {
      totalRevenue,
      totalTickets,
      myShare,
      driverStatus: driverInfo?.checkInStatus,
      workingDrivers: workingDriversToday
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in getDashboardData:', error);
    throw error;
  }
}

// ฟังก์ชันเสริมอื่นๆ
async function getDailyIncome(driverId: string, date: string) {
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
    
    // คำนวณส่วนแบ่งคนขับ
    const driversShare = Math.round(totalRevenue * 0.85);
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const myShare = totalDrivers > 0 ? Math.round(driversShare / totalDrivers) : 0;
    
    return {
      date,
      totalRevenue,
      ticketCount,
      myShare,
      driversShare,
      totalDrivers
    };
    
  } catch (error) {
    console.error('❌ Error in getDailyIncome:', error);
    throw error;
  }
}

async function getMonthlyIncome(driverId: string, year: number, month: number) {
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
    
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    
    return dailyResults.map(item => ({
      date: item.date,
      totalRevenue: item.totalRevenue,
      ticketCount: item.ticketCount,
      myShare: totalDrivers > 0 ? Math.round((item.totalRevenue * 0.85) / totalDrivers) : 0
    }));
    
  } catch (error) {
    console.error('❌ Error in getMonthlyIncome:', error);
    throw error;
  }
}

async function getSummaryIncome(driverId: string, startDate: Date, endDate: Date) {
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
          avgTicketPrice: { $avg: '$price' }
        }
      }
    ]);
    
    if (summaryResult.length === 0) {
      return {
        totalRevenue: 0,
        totalTickets: 0,
        myTotalShare: 0,
        avgTicketPrice: 0
      };
    }
    
    const data = summaryResult[0];
    const driversShare = Math.round(data.totalRevenue * 0.85);
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const myTotalShare = totalDrivers > 0 ? Math.round(driversShare / totalDrivers) : 0;
    
    return {
      totalRevenue: data.totalRevenue,
      totalTickets: data.totalTickets,
      myTotalShare: myTotalShare,
      avgTicketPrice: Math.round(data.avgTicketPrice)
    };
    
  } catch (error) {
    console.error('❌ Error in getSummaryIncome:', error);
    throw error;
  }
}