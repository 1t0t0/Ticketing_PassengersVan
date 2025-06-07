// app/api/driver/revenue/route.ts - แก้ไข Filter การนับรอบ
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงข้อมูลรายได้ (รวมเงื่อนไข 2 รอบ)
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const driverId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // ดึงสถานะรอบปัจจุบัน
    const activeTrip = await DriverTrip.findOne({
      driver_id: driverId,
      date: today,
      status: 'in_progress'
    });

    // ✅ แก้ไข: นับเฉพาะรอบที่ถึง 80% และ status = 'completed' เท่านั้น
    const completedTripsToday = await DriverTrip.countDocuments({
      driver_id: driverId,
      date: today,
      status: 'completed',
      is_80_percent_reached: true  // ✅ เพิ่มเงื่อนไขนี้
    });

    // เช็คว่ามีสิทธิ์รับรายได้หรือไม่ (ต้องอย่างน้อย 2 รอบที่ถึง 80%)
    const qualifiesForRevenue = completedTripsToday >= 2;
    
    const revenueStatus = qualifiesForRevenue ? 
      'ມີສິດຮັບສ່ວນແບ່ງລາຍຮັບ 85%' : 
      `ຕ້ອງການອີກ ${2 - completedTripsToday} ຮອບເພື່ອໄດ້ຮັບສ່ວນແບ່ງລາຍຮັບ`;

    const tripStatus = {
      has_active_trip: !!activeTrip,
      active_trip: activeTrip ? {
        trip_id: activeTrip._id.toString(),
        trip_number: activeTrip.trip_number,
        current_passengers: activeTrip.current_passengers,
        required_passengers: activeTrip.required_passengers,
        car_capacity: activeTrip.car_capacity,
        started_at: activeTrip.started_at
      } : null,
      completed_trips_today: completedTripsToday,  // ✅ ตอนนี้จะเป็นรอบที่ถึง 80% เท่านั้น
      qualifies_for_revenue: qualifiesForRevenue,
      revenue_status: revenueStatus
    };
    
    // คำนวณรายได้ (ถ้ามี DriverTrip.calculateDriverRevenue method)
    let revenueData = null;
    try {
      if (typeof DriverTrip.calculateDriverRevenue === 'function') {
        revenueData = await DriverTrip.calculateDriverRevenue(date);
      }
    } catch (error) {
      console.warn('calculateDriverRevenue method not available:', error);
    }
    
    // ตรวจสอบว่า driver คนนี้มีสิทธิ์ได้รับส่วนแบ่งหรือไม่
    let myRevenue = null;
    if (revenueData && revenueData.drivers) {
      myRevenue = revenueData.drivers.find(
        (driver: any) => driver.driver_id.toString() === driverId
      );
    }
    
    return NextResponse.json({
      success: true,
      date: date,
      trip_status: tripStatus,
      revenue_data: revenueData ? {
        total_revenue: revenueData.total_revenue,
        driver_share_total: revenueData.driver_share_total,
        qualified_drivers: revenueData.qualified_drivers,
        my_qualification: {
          completed_trips: tripStatus.completed_trips_today,
          qualifies: tripStatus.qualifies_for_revenue,
          revenue_share: myRevenue?.revenue_share || 0,
          status_message: tripStatus.revenue_status
        }
      } : {
        total_revenue: 0,
        driver_share_total: 0,
        qualified_drivers: 0,
        my_qualification: {
          completed_trips: tripStatus.completed_trips_today,
          qualifies: tripStatus.qualifies_for_revenue,
          revenue_share: 0,
          status_message: tripStatus.revenue_status
        }
      }
    });

  } catch (error) {
    console.error('Get Driver Revenue Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get driver revenue data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}