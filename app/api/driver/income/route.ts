// app/api/driver/income/route.ts - แก้ไขให้แสดงรายได้เฉพาะคนขับที่ทำครบ 2 รอบ
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ticket from '@/models/Ticket';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงรายได้ของ Driver (เฉพาะคนที่ทำครบ 2 รอบ)
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

// ✅ ฟังก์ชันใหม่: รองรับ date range - เฉพาะคนขับที่ทำครบ 2 รอบ
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
    
    // 2. ✅ ใหม่: หาคนขับที่ทำครบ 2 รอบในช่วงนี้
    const dateArray: string[] = [];
    const currentDate = new Date(startOfRange);
    const endDateOnly = new Date(endOfRange);
    
    while (currentDate <= endDateOnly) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // หาคนขับที่มีสิทธิ์ได้รับเงินในแต่ละวัน
    const qualifiedDriversPerDay = await Promise.all(
      dateArray.map(async (dateString: string) => {
        // หาคนขับที่ทำครบ 2 รอบในวันนั้น
        const qualifiedDrivers = await DriverTrip.aggregate([
          {
            $match: {
              date: dateString,
              status: 'completed',
              is_80_percent_reached: true
            }
          },
          {
            $group: {
              _id: '$driver_id',
              completed_trips: { $sum: 1 }
            }
          },
          {
            $match: {
              completed_trips: { $gte: 2 }
            }
          }
        ]);
        
        return {
          date: dateString,
          qualifiedDrivers: qualifiedDrivers.map(d => d._id.toString())
        };
      })
    );
    
    // รวมคนขับทั้งหมดที่มีสิทธิ์ในช่วงนี้
    const allQualifiedDrivers = new Set<string>();
    qualifiedDriversPerDay.forEach(day => {
      day.qualifiedDrivers.forEach(driverId => {
        allQualifiedDrivers.add(driverId);
      });
    });
    
    const totalQualifiedDrivers = allQualifiedDrivers.size;
    
    // 3. ตรวจสอบว่าคนขับคนนี้มีสิทธิ์หรือไม่
    const currentDriverQualified = allQualifiedDrivers.has(driverId);
    
    // 4. คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driversShare = Math.round(totalRevenue * 0.85);
    
    // 5. ✅ คำนวณส่วนแบ่งของคนขับคนนี้ - ได้เฉพาะเมื่อมีสิทธิ์
    const myCalculatedShare = (currentDriverQualified && totalQualifiedDrivers > 0) 
      ? Math.round(driversShare / totalQualifiedDrivers) 
      : 0;
    
    // 6. ตรวจสอบรอบที่ทำในช่วงนี้
    const myTripsInRange = await DriverTrip.aggregate([
      {
        $match: {
          driver_id: new (require('mongoose').Types.ObjectId)(driverId),
          date: { $in: dateArray },
          status: 'completed',
          is_80_percent_reached: true
        }
      },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 }
        }
      }
    ]);
    
    const myQualifiedTrips = myTripsInRange.length > 0 ? myTripsInRange[0].totalTrips : 0;
    
    // 7. คำนวณจำนวนวันในช่วงนี้
    const totalDays = Math.ceil((endOfRange.getTime() - startOfRange.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 8. ดึงข้อมูลผู้ใช้
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
      todayRevenue: totalRevenue,
      companyRevenue: companyShare,
      stationRevenue: stationShare,
      driverRevenue: driversShare,
      
      // ✅ ข้อมูลใหม่ที่แสดงเฉพาะคนขับที่มีสิทธิ์
      qualifiedDriversCount: totalQualifiedDrivers,
      myQualifiedTrips: myQualifiedTrips,
      myDailyIncome: myCalculatedShare,
      myExpectedShare: myCalculatedShare,
      myTicketsCount: Math.round(totalTickets / Math.max(totalQualifiedDrivers, 1)),
      
      monthlyIncome: myCalculatedShare,
      monthlyDays: totalDays,
      
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      averageDriverShare: totalQualifiedDrivers > 0 ? Math.round(driversShare / totalQualifiedDrivers) : 0,
      
      // ✅ ข้อมูลสิทธิ์
      hasRevenue: currentDriverQualified,
      qualificationMessage: currentDriverQualified 
        ? `✅ ທ່ານມີສິດຮັບສ່ວນແບ່ງລາຍຮັບ (ທຳ ${myQualifiedTrips} ຮອບສຳເລັດ)`
        : `❌ ທ່ານບໍ່ມີສິດຮັບສ່ວນແບ່ງລາຍຮັບ (ຕ້ອງການ 2 ຮອບຕໍ່ວັນ)`,
      
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
        qualifiedDrivers: totalQualifiedDrivers,
        sharePerDriver: totalQualifiedDrivers > 0 ? Math.round(driversShare / totalQualifiedDrivers) : 0,
        method: 'qualified_drivers_only_2_trips_minimum'
      }
    };
    
    console.log('✅ Dashboard range result:', {
      totalRevenue,
      totalTickets, 
      totalDays,
      qualifiedDrivers: totalQualifiedDrivers,
      currentDriverQualified,
      myShare: myCalculatedShare,
      myTrips: myQualifiedTrips
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in getDashboardDataRange:', error);
    throw error;
  }
}

// ✅ แก้ไขฟังก์ชันเดิม: สำหรับวันเดียว - เฉพาะคนขับที่ทำครบ 2 รอบ
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
    
    // ✅ ใหม่: หาคนขับที่ทำครบ 2 รอบในวันนี้
    const qualifiedDriversToday = await DriverTrip.aggregate([
      {
        $match: {
          date: date,
          status: 'completed',
          is_80_percent_reached: true
        }
      },
      {
        $group: {
          _id: '$driver_id',
          completed_trips: { $sum: 1 }
        }
      },
      {
        $match: {
          completed_trips: { $gte: 2 }
        }
      }
    ]);
    
    const totalQualifiedDrivers = qualifiedDriversToday.length;
    
    // ตรวจสอบว่าคนขับคนนี้มีสิทธิ์หรือไม่
    const currentDriverQualified = qualifiedDriversToday.some(
      driver => driver._id.toString() === driverId
    );
    
    const myTripsToday = qualifiedDriversToday.find(
      driver => driver._id.toString() === driverId
    )?.completed_trips || 0;
    
    console.log(`💡 Qualified drivers today: ${totalQualifiedDrivers} drivers, Current driver qualified: ${currentDriverQualified}, My trips: ${myTripsToday}`);
    
    // คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * 0.10);
    const stationShare = Math.round(totalRevenue * 0.05);
    const driversShare = Math.round(totalRevenue * 0.85);
    
    // ✅ คำนวณส่วนแบ่งของคนขับคนนี้ - ได้เฉพาะเมื่อมีสิทธิ์
    const myShare = (currentDriverQualified && totalQualifiedDrivers > 0) 
      ? Math.round(driversShare / totalQualifiedDrivers) 
      : 0;
    
    // คำนวณจำนวนตั๋วประมาณของคนขับคนนี้
    const myTicketsCount = (currentDriverQualified && totalQualifiedDrivers > 0) 
      ? Math.round(totalTickets / totalQualifiedDrivers)
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
    
    // สำหรับรายได้เดือน ต้องหาจำนวนคนขับที่มีสิทธิ์ในช่วง 30 วันที่ผ่านมา
    const monthlyQualifiedDrivers = await DriverTrip.aggregate([
      {
        $match: {
          date: { 
            $gte: oneMonthAgo.toISOString().split('T')[0], 
            $lte: date 
          },
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
          qualified_days: { $sum: 1 }
        }
      }
    ]);
    
    const totalQualifiedDriversMonthly = monthlyQualifiedDrivers.length;
    const monthlyMyShare = (totalQualifiedDriversMonthly > 0 && currentDriverQualified) 
      ? Math.round(monthlyDriversShare / totalQualifiedDriversMonthly)
      : 0;
    
    const daysInMonth = 30;
    
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
      
      // ✅ ข้อมูลใหม่ที่แสดงเฉพาะคนขับที่มีสิทธิ์
      qualifiedDriversCount: totalQualifiedDrivers,
      myQualifiedTrips: myTripsToday,
      myDailyIncome: myShare,
      myExpectedShare: myShare,
      myTicketsCount: myTicketsCount,
      
      monthlyIncome: monthlyMyShare,
      monthlyDays: daysInMonth,
      
      averagePerTicket: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
      averageDriverShare: totalQualifiedDrivers > 0 ? Math.round(driversShare / totalQualifiedDrivers) : 0,
      
      // ✅ ข้อมูลสิทธิ์
      hasRevenue: currentDriverQualified,
      qualificationMessage: currentDriverQualified 
        ? `✅ ທ່ານມີສິດຮັບສ່ວນແບ່ງລາຍຮັບ (ທຳ ${myTripsToday} ຮອບສຳເລັດ)`
        : `❌ ທ່ານບໍ່ມີສິດຮັບສ່ວນແບ່ງລາຍຮັບ (ຕ້ອງການ 2 ຮອບຕໍ່ວັນ)`,
      
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
        qualifiedDrivers: totalQualifiedDrivers,
        sharePerDriver: totalQualifiedDrivers > 0 ? Math.round(driversShare / totalQualifiedDrivers) : 0,
        method: 'qualified_drivers_only_2_trips_minimum'
      }
    };
    
    console.log('✅ Dashboard result:', {
      totalRevenue,
      totalTickets,
      qualifiedDrivers: totalQualifiedDrivers,
      currentDriverQualified,
      myShare,
      myTrips: myTripsToday
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in getDashboardData:', error);
    throw error;
  }
}

// ฟังก์ชันเสริมอื่นๆ (เดิม)
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
    
    // หาคนขับที่มีสิทธิ์ในวันนั้น
    const qualifiedDrivers = await DriverTrip.aggregate([
      {
        $match: {
          date: date,
          status: 'completed',
          is_80_percent_reached: true
        }
      },
      {
        $group: {
          _id: '$driver_id',
          completed_trips: { $sum: 1 }
        }
      },
      {
        $match: {
          completed_trips: { $gte: 2 }
        }
      }
    ]);
    
    const totalQualifiedDrivers = qualifiedDrivers.length;
    const currentDriverQualified = qualifiedDrivers.some(
      driver => driver._id.toString() === driverId
    );
    
    const driversShare = Math.round(totalRevenue * 0.85);
    const myShare = (currentDriverQualified && totalQualifiedDrivers > 0) 
      ? Math.round(driversShare / totalQualifiedDrivers) 
      : 0;
    
    return {
      date,
      totalRevenue,
      ticketCount,
      myShare,
      driversShare,
      totalQualifiedDrivers,
      hasRevenue: currentDriverQualified
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
    
    // สำหรับแต่ละวัน หาคนขับที่มีสิทธิ์และคำนวณส่วนแบ่ง
    const resultsWithDriverShare = await Promise.all(
      dailyResults.map(async (item) => {
        const dateString = item.date.toISOString().split('T')[0];
        
        const qualifiedDrivers = await DriverTrip.aggregate([
          {
            $match: {
              date: dateString,
              status: 'completed',
              is_80_percent_reached: true
            }
          },
          {
            $group: {
              _id: '$driver_id',
              completed_trips: { $sum: 1 }
            }
          },
          {
            $match: {
              completed_trips: { $gte: 2 }
            }
          }
        ]);
        
        const totalQualifiedDrivers = qualifiedDrivers.length;
        const currentDriverQualified = qualifiedDrivers.some(
          driver => driver._id.toString() === driverId
        );
        
        const driversShare = Math.round(item.totalRevenue * 0.85);
        const myShare = (currentDriverQualified && totalQualifiedDrivers > 0) 
          ? Math.round(driversShare / totalQualifiedDrivers) 
          : 0;
        
        return {
          date: item.date,
          totalRevenue: item.totalRevenue,
          ticketCount: item.ticketCount,
          myShare: myShare,
          hasRevenue: currentDriverQualified
        };
      })
    );
    
    return resultsWithDriverShare;
    
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
        avgTicketPrice: 0,
        hasRevenue: false
      };
    }
    
    const data = summaryResult[0];
    const driversShare = Math.round(data.totalRevenue * 0.85);
    
    // หาว่าในช่วงนี้คนขับคนนี้มีสิทธิ์กี่วัน
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const dateArray: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateArray.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    let totalMyShare = 0;
    let qualifiedDays = 0;
    
    for (const dateString of dateArray) {
      const qualifiedDrivers = await DriverTrip.aggregate([
        {
          $match: {
            date: dateString,
            status: 'completed',
            is_80_percent_reached: true
          }
        },
        {
          $group: {
            _id: '$driver_id',
            completed_trips: { $sum: 1 }
          }
        },
        {
          $match: {
            completed_trips: { $gte: 2 }
          }
        }
      ]);
      
      const currentDriverQualified = qualifiedDrivers.some(
        driver => driver._id.toString() === driverId
      );
      
      if (currentDriverQualified) {
        qualifiedDays++;
        // หารายได้ของวันนั้น
        const dayRevenue = await Ticket.aggregate([
          {
            $match: {
              soldAt: { 
                $gte: new Date(dateString + 'T00:00:00.000Z'), 
                $lte: new Date(dateString + 'T23:59:59.999Z') 
              }
            }
          },
          {
            $group: {
              _id: null,
              dayRevenue: { $sum: '$price' }
            }
          }
        ]);
        
        if (dayRevenue.length > 0) {
          const dayDriversShare = Math.round(dayRevenue[0].dayRevenue * 0.85);
          const dayMyShare = qualifiedDrivers.length > 0 ? Math.round(dayDriversShare / qualifiedDrivers.length) : 0;
          totalMyShare += dayMyShare;
        }
      }
    }
    
    return {
      totalRevenue: data.totalRevenue,
      totalTickets: data.totalTickets,
      myTotalShare: totalMyShare,
      avgTicketPrice: Math.round(data.avgTicketPrice),
      hasRevenue: qualifiedDays > 0,
      qualifiedDays: qualifiedDays
    };
    
  } catch (error) {
    console.error('❌ Error in getSummaryIncome:', error);
    throw error;
  }
}