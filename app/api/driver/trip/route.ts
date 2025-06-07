// app/api/driver/trip/route.ts - แก้ไข Mongoose schema error และ Filter 80%
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import Car from '@/models/Car';
import User from '@/models/User';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงสถานะรอบปัจจุบัน
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
    
    const driverId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // หารอบที่กำลังดำเนินการ
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

    // ✅ แก้ไข: ดึงข้อมูล ticket ที่ถูกต้องพร้อม populate
    let passengersData = [];
    if (activeTrip && activeTrip.scanned_tickets && activeTrip.scanned_tickets.length > 0) {
      try {
        passengersData = await Promise.all(
          activeTrip.scanned_tickets.map(async (ticket: any) => {
            try {
              // ดึงข้อมูล ticket จาก database
              const ticketDoc = await Ticket.findById(ticket.ticket_id).select('ticketNumber');
              
              return {
                order: ticket.passenger_order,
                ticket_number: ticketDoc ? ticketDoc.ticketNumber : `T${ticket.passenger_order.toString().padStart(5, '0')}`,
                scanned_at: ticket.scanned_at
              };
            } catch (error) {
              console.warn('Failed to fetch ticket:', ticket.ticket_id);
              // ถ้าหา ticket ไม่เจอ ให้ใช้เลขลำดับแทน
              return {
                order: ticket.passenger_order,
                ticket_number: `T${ticket.passenger_order.toString().padStart(5, '0')}`,
                scanned_at: ticket.scanned_at
              };
            }
          })
        );
      } catch (error) {
        console.error('Error fetching passengers data:', error);
        passengersData = [];
      }
    }

    const tripStatus = {
      has_active_trip: !!activeTrip,
      active_trip: activeTrip ? {
        trip_id: activeTrip._id.toString(),
        trip_number: activeTrip.trip_number,
        current_passengers: activeTrip.current_passengers,
        required_passengers: activeTrip.required_passengers,
        car_capacity: activeTrip.car_capacity,
        started_at: activeTrip.started_at,
        passengers: passengersData  // ✅ ใช้ข้อมูลที่ populate แล้ว
      } : null,
      completed_trips_today: completedTripsToday,  // ✅ ตอนนี้จะเป็นรอบที่ถึง 80% เท่านั้น
      qualifies_for_revenue: qualifiesForRevenue,
      revenue_status: revenueStatus
    };
    
    return NextResponse.json({
      success: true,
      data: tripStatus
    });

  } catch (error) {
    console.error('Get Trip Status Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get trip status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - เริ่มรอบใหม่ (แก้ไขเพื่อหลีกเลี่ยง Mongoose schema error)
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
    
    // ดึงข้อมูลรถของ driver โดยตรงแทนการใช้ mongoose.model ใน static method
    const driverCar = await Car.findOne({ user_id: driverId });
    if (!driverCar) {
      return NextResponse.json(
        { 
          error: 'ບໍ່ພົບຂໍ້ມູນລົດຂອງພະນັກງານຂັບລົດ',
          details: 'No car assigned to this driver'
        },
        { status: 404 }
      );
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // ตรวจสอบว่ามีรอบที่ยังไม่เสร็จหรือไม่
    const activeTrip = await DriverTrip.findOne({
      driver_id: driverId,
      date: today,
      status: 'in_progress'
    });
    
    if (activeTrip) {
      return NextResponse.json(
        { 
          error: 'ທ່ານມີການເດີນທາງທີ່ຍັງບໍ່ສຳເລັດ ກະລຸນາສຳເລັດກ່ອນ',
          details: 'Active trip already exists'
        },
        { status: 400 }
      );
    }
    
    // หาว่าวันนี้เป็นรอบที่เท่าไหร่ (นับรวมทุกรอบ ไม่ว่าจะถึง 80% หรือไม่)
    const tripCount = await DriverTrip.countDocuments({
      driver_id: driverId,
      date: today
    });
    
    const tripNumber = tripCount + 1;
    const carCapacity = driverCar.car_capacity || 10; // default capacity
    const requiredPassengers = Math.floor(carCapacity * 0.8); // 80%
    
    // สร้างรอบใหม่
    const newTrip = await DriverTrip.create({
      driver_id: driverId,
      car_id: driverCar._id,
      trip_number: tripNumber,
      date: today,
      car_capacity: carCapacity,
      required_passengers: requiredPassengers,
      current_passengers: 0,
      is_80_percent_reached: false,
      started_at: new Date(),
      scanned_tickets: []
    });
    
    console.log('New trip created:', {
      tripId: newTrip._id,
      tripNumber,
      driverId,
      carCapacity,
      requiredPassengers
    });
    
    return NextResponse.json({
      success: true,
      trip_id: newTrip._id,
      trip_number: tripNumber,
      car_capacity: carCapacity,
      required_passengers: requiredPassengers,
      message: `ເລີ່ມການເດີນທາງຮອບທີ ${tripNumber} - ຕ້ອງການຜູ້ໂດຍສານ ${requiredPassengers}/${carCapacity} ຄົນ`
    });

  } catch (error) {
    console.error('Start New Trip Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to start new trip',
        details: error instanceof Error ? error.stack : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}