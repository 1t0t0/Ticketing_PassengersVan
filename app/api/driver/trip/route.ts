// app/api/driver/trip/route.ts - แก้ไข Mongoose schema error
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import Car from '@/models/Car'; // เพิ่มการ import Car model
import User from '@/models/User'; // เพิ่มการ import User model
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
    const status = await DriverTrip.getCurrentTripStatus(driverId);
    
    return NextResponse.json({
      success: true,
      data: status
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
    
    // หาว่าวันนี้เป็นรอบที่เท่าไหร่
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