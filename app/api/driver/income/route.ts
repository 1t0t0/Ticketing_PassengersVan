// app/api/driver/income/route.ts - Enhanced version
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
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
    const type = searchParams.get('type') || 'dashboard'; // dashboard, daily, monthly, summary
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const driverId = session.user.id;

    let result;

    switch (type) {
      case 'dashboard':
        // Check if date range is provided
        if (startDate && endDate) {
          result = await getDashboardDataRange(driverId, startDate, endDate);
        } else {
          result = await getDashboardData(driverId, date);
        }
        break;
        
      case 'daily':
        result = await Income.getDriverDailyIncome(driverId, date);
        break;
        
      case 'monthly':
        result = await Income.getDriverMonthlyIncome(driverId, year, month);
        break;
        
      case 'summary':
        // รายงานสรุปย้อนหลัง 30 วัน
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const summaryData = await Income.aggregate([
          {
            $match: {
              driver_id: new Income.base.Types.ObjectId(driverId),
              revenue_share_type: 'driver',
              income_date: {
                $gte: thirtyDaysAgo,
                $lte: today
              }
            }
          },
          {
            $group: {
              _id: null,
              totalIncome: { $sum: '$income_amount' },
              totalTickets: { $sum: 1 },
              avgDailyIncome: { $avg: '$income_amount' },
              maxDailyIncome: { $max: '$income_amount' },
              minDailyIncome: { $min: '$income_amount' }
            }
          }
        ]);
        
        result = summaryData.length > 0 ? summaryData[0] : {
          totalIncome: 0,
          totalTickets: 0,
          avgDailyIncome: 0,
          maxDailyIncome: 0,
          minDailyIncome: 0
        };
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

// ฟังก์ชันสำหรับดึงข้อมูล Dashboard แบบช่วงวันที่ - ใช้ Tickets โดยตรง
async function getDashboardDataRange(driverId: string, startDateStr: string, endDateStr: string) {
  try {
    console.log('Fetching dashboard data range for driver:', driverId, 'from:', startDateStr, 'to:', endDateStr);
    
    const startOfRange = new Date(startDateStr + 'T00:00:00.000Z');
    const endOfRange = new Date(endDateStr + 'T23:59:59.999Z');
    
    console.log('Date range objects:', { startOfRange, endOfRange });
    
    // 1. ดึงข้อมูลรายได้รวมในช่วงนี้ (จาก Tickets)
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
    
    console.log('Total revenue in range:', totalRevenue, 'Total tickets:', totalTickets);
    
    // 2. ดึงจำนวนคนขับที่เข้าทำงาน (ใช้ข้อมูลปัจจุบัน)
    const workingDriversToday = await User.countDocuments({
      role: 'driver',
      checkInStatus: 'checked-in'
    });
    
    console.log('Working drivers count:', workingDriversToday);
    
    // 3. คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);    // 10%
    const stationShare = Math.round(totalRevenue * 0.05);    // 5%
    const driversShare = Math.round(totalRevenue * 0.85);    // 85%
    
    // 4. คำนวณส่วนแบ่งของคนขับคนนี้ 
    // (สมมติว่าแบ่งเท่าๆ กันระหว่างคนขับที่เข้าทำงาน)
    const myCalculatedShare = workingDriversToday > 0 
      ? Math.round(driversShare / workingDriversToday) 
      : 0;
    
    // 5. คำนวณจำนวนวันในช่วงนี้
    const totalDays = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 6. ดึงข้อมูลผู้ใช้
    const driverInfo = await User.findById(driverId).select('name employeeId checkInStatus');
    console.log('Driver info:', driverInfo);
    
    // 7. คำนวณรายได้เฉลี่ยต่อวัน
    const avgRevenuePerDay = totalDays > 0 ? Math.round(totalRevenue / totalDays) : 0;
    const avgDriverSharePerDay = totalDays > 0 ? Math.round(myCalculatedShare / totalDays) : myCalculatedShare;
    
    // 8. ดึงตัวอย่าง tickets เพื่อ debug
    const sampleTickets = await Ticket.find({
      soldAt: { $gte: startOfRange, $lte: endOfRange }
    }).limit(5).select('ticketNumber price soldAt soldBy');
    
    console.log('Sample tickets in range:', sampleTickets);
    
    const result = {
      // ข้อมูลพื้นฐาน
      driver: {
        id: driverId,
        name: driverInfo?.name || 'Unknown',
        employeeId: driverInfo?.employeeId || 'N/A',
        checkInStatus: driverInfo?.checkInStatus || 'checked-out'
      },
      
      // ข้อมูลช่วงวันที่
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
        totalDays: totalDays
      },
      
      // รายได้รวมในช่วงนี้
      totalRevenue: totalRevenue,
      totalTickets: totalTickets,
      
      // การแบ่งรายได้
      todayRevenue: totalRevenue,
      companyRevenue: companyShare,
      stationRevenue: stationShare,
      driverRevenue: driversShare,
      
      // ข้อมูลคนขับ
      workingDriversCount: workingDriversToday,
      myDailyIncome: myCalculatedShare,
      myExpectedShare: myCalculatedShare,
      myTicketsCount: Math.round(totalTickets / Math.max(workingDriversToday, 1)), // ประมาณการ
      
      // รายได้เดือนนี้ (ใช้ข้อมูลในช่วงที่เลือก)
      monthlyIncome: myCalculatedShare,
      monthlyDays: totalDays,
      
      // คำนวณเพิ่มเติม
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      averageDriverShare: workingDriversToday > 0 ? Math.round(driversShare / workingDriversToday) : 0,
      
      // ข้อมูลสำหรับ Chart
      chartData: {
        company: companyShare,
        station: stationShare,
        drivers: driversShare
      },
      
      // รายละเอียดการคำนวณ
      calculation: {
        totalRevenue: totalRevenue,
        companyPercent: 10,
        stationPercent: 5,
        driversPercent: 85,
        workingDrivers: workingDriversToday,
        sharePerDriver: myCalculatedShare,
        avgRevenuePerDay: avgRevenuePerDay,
        avgDriverSharePerDay: avgDriverSharePerDay,
        method: 'calculated_from_tickets'
      },
      
      // Debug info
      debug: {
        sampleTicketsCount: sampleTickets.length,
        dateRangeCalculated: { startOfRange, endOfRange },
        totalDaysCalculated: totalDays
      }
    };
    
    console.log('Dashboard range result (from tickets):', result);
    return result;
    
  } catch (error) {
    console.error('Error in getDashboardDataRange:', error);
    throw error;
  }
}

// ฟังก์ชันสำหรับดึงข้อมูล Dashboard
// ฟังก์ชันสำหรับดึงข้อมูล Dashboard - ใช้ Tickets โดยตรง
async function getDashboardData(driverId: string, date: string) {
  try {
    console.log('Fetching dashboard data for driver:', driverId, 'date:', date);
    
    // 1. ดึงข้อมูลรายได้รวมของวันนี้ (จาก Tickets)
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
    
    console.log('Total revenue today:', totalRevenue, 'Total tickets:', totalTickets);
    
    // Debug: ตรวจสอบ tickets ในวันนี้
    const sampleTickets = await Ticket.find({
      soldAt: { $gte: startOfDay, $lte: endOfDay }
    }).limit(3).select('ticketNumber price soldAt soldBy');
    console.log('Sample tickets today:', sampleTickets);
    
    // 2. ดึงจำนวนคนขับที่เข้าทำงานวันนี้
    const workingDriversToday = await User.countDocuments({
      role: 'driver',
      checkInStatus: 'checked-in'
    });
    
    console.log('Working drivers today:', workingDriversToday);
    
    // 3. คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);    // 10%
    const stationShare = Math.round(totalRevenue * 0.05);    // 5%
    const driversShare = Math.round(totalRevenue * 0.85);    // 85%
    
    // 4. คำนวณส่วนแบ่งของคนขับคนนี้
    const myShare = workingDriversToday > 0 
      ? Math.round(driversShare / workingDriversToday) 
      : 0;
    
    // 5. คำนวณจำนวนตั๋วประมาณของคนขับคนนี้
    const myTicketsCount = workingDriversToday > 0 
      ? Math.round(totalTickets / workingDriversToday)
      : 0;
    
    // 6. ดึงข้อมูลรายได้เดือนนี้ (คำนวณจาก Tickets ช่วง 1 เดือนที่ผ่านมา)
    const oneMonthAgo = new Date(startOfDay);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
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
    const monthlyMyShare = workingDriversToday > 0 
      ? Math.round(monthlyDriversShare / workingDriversToday)
      : 0;
    
    // 7. คำนวณจำนวนวันที่ทำงานในเดือน (ประมาณการ)
    const daysInMonth = Math.ceil((endOfDay.getTime() - oneMonthAgo.getTime()) / (1000 * 60 * 60 * 24));
    
    // 8. ดึงข้อมูลผู้ใช้
    const driverInfo = await User.findById(driverId).select('name employeeId checkInStatus');
    
    const result = {
      // ข้อมูลพื้นฐาน
      driver: {
        id: driverId,
        name: driverInfo?.name || 'Unknown',
        employeeId: driverInfo?.employeeId || 'N/A',
        checkInStatus: driverInfo?.checkInStatus || 'checked-out'
      },
      
      // รายได้รวมทั้งหมดวันนี้
      totalRevenue: totalRevenue,
      totalTickets: totalTickets,
      
      // การแบ่งรายได้วันนี้
      todayRevenue: totalRevenue,  // รายได้รวมวันนี้
      companyRevenue: companyShare,
      stationRevenue: stationShare,
      driverRevenue: driversShare,
      
      // ข้อมูลคนขับ
      workingDriversCount: workingDriversToday,
      myDailyIncome: myShare,  // ส่วนแบ่งที่คำนวณได้วันนี้
      myExpectedShare: myShare,  // ส่วนแบ่งที่ควรได้รับ
      myTicketsCount: myTicketsCount,
      
      // รายได้เดือนนี้
      monthlyIncome: monthlyMyShare,
      monthlyDays: daysInMonth,
      
      // คำนวณเพิ่มเติม
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      averageDriverShare: workingDriversToday > 0 ? Math.round(driversShare / workingDriversToday) : 0,
      
      // ข้อมูลสำหรับ Chart
      chartData: {
        company: companyShare,
        station: stationShare,
        drivers: driversShare
      },
      
      // รายละเอียดการคำนวณ
      calculation: {
        totalRevenue: totalRevenue,
        companyPercent: 10,
        stationPercent: 5,
        driversPercent: 85,
        workingDrivers: workingDriversToday,
        sharePerDriver: myShare,
        method: 'calculated_from_tickets'
      }
    };
    
    console.log('Dashboard result (from tickets):', result);
    return result;
    
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    throw error;
  }
}