// app/api/driver/complete/route.ts - ตรวจสอบและแก้ไข Filter
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - ปิดรอบด้วยมือ
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can access this endpoint' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const driverId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // ตรวจสอบว่ามีรอบที่กำลังดำเนินการอยู่หรือไม่
    const activeTrip = await DriverTrip.findOne({
      driver_id: driverId,
      date: today,
      status: 'in_progress'
    });
    
    if (!activeTrip) {
      return NextResponse.json(
        { error: 'ບໍ່ມີການເດີນທາງທີ່ກຳລັງດຳເນີນການ' },
        { status: 400 }
      );
    }
    
    // ✅ ตรวจสอบว่าถึง 80% หรือไม่
    const is80PercentReached = activeTrip.current_passengers >= activeTrip.required_passengers;
    const completedAt = new Date();
    
    // อัพเดทสถานะรอบ
    activeTrip.status = 'completed';
    activeTrip.completed_at = completedAt;
    activeTrip.is_80_percent_reached = is80PercentReached;
    
    await activeTrip.save();
    
    // สร้างข้อความตอบกลับ
    let message = '';
    let qualificationStatus = '';
    
    if (is80PercentReached) {
      message = `🎉 ສຳເລັດຮອບທີ ${activeTrip.trip_number}! มีผู้โดยสาร ${activeTrip.current_passengers}/${activeTrip.required_passengers} ຄົນ`;
      qualificationStatus = 'ຮອບນີ້ນັບເຂົ້າເງື່ອນໄຂລາຍຮັບ';
    } else {
      message = `⚠️ ປິດຮອບທີ ${activeTrip.trip_number} - มีผู้โดยสาร ${activeTrip.current_passengers}/${activeTrip.required_passengers} ຄົນ`;
      qualificationStatus = 'ຮອບນີ້ບໍ່ນັບເຂົ້າເງື່ອນໄຂລາຍຮັບ (ຕ້ອງການ 80%)';
    }
    
    // ✅ แก้ไข: นับรอบที่สำเร็จแล้ววันนี้ (เฉพาะที่ถึง 80% เท่านั้น)
    const completedTripsToday = await DriverTrip.countDocuments({
      driver_id: driverId,
      date: today,
      status: 'completed',
      is_80_percent_reached: true // ✅ เพิ่มเงื่อนไขนี้
    });
    
    // ตรวจสอบสิทธิ์รายได้
    const qualifiesForRevenue = completedTripsToday >= 2;
    
    console.log('Trip completed manually:', {
      tripId: activeTrip._id,
      tripNumber: activeTrip.trip_number,
      passengers: activeTrip.current_passengers,
      required: activeTrip.required_passengers,
      qualifies: is80PercentReached,
      completedTripsToday: completedTripsToday,
      qualifiesForRevenue: qualifiesForRevenue
    });
    
    return NextResponse.json({
      success: true,
      trip_number: activeTrip.trip_number,
      current_passengers: activeTrip.current_passengers,
      required_passengers: activeTrip.required_passengers,
      car_capacity: activeTrip.car_capacity,
      is_80_percent_reached: is80PercentReached,
      trip_completed: true,
      completed_at: completedAt,
      message: message,
      qualification_status: qualificationStatus,
      completed_trips_today: completedTripsToday, // ✅ ตอนนี้จะนับเฉพาะรอบที่ถึง 80%
      qualifies_for_revenue: qualifiesForRevenue,
      revenue_status: qualifiesForRevenue ? 
        'ມີສິດຮັບສ່ວນແບ່ງລາຍຮັບ 85%' : 
        `ຕ້ອງການອີກ ${2 - completedTripsToday} ຮອບເພື່ອໄດ້ຮັບສ່ວນແບ່ງລາຍຮັບ`
    });

  } catch (error) {
    console.error('Complete Trip Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to complete trip',
        details: error instanceof Error ? error.stack : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}