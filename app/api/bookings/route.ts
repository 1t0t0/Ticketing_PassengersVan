// app/api/bookings/route.ts - API สำหรับจัดการ Booking
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Car from '@/models/Car';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - ดึงรายการ Booking
export async function GET(request: Request) {
  try {
    // ตรวจสอบ authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const driverId = searchParams.get('driver_id');
    const carId = searchParams.get('car_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // สร้าง filter
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (driverId) {
      filter.driver_id = driverId;
    }
    
    if (carId) {
      filter.car_id = carId;
    }
    
    // คำนวณ pagination
    const skip = (page - 1) * limit;
    
    // ดึงข้อมูล bookings
    const bookings = await Booking.find(filter)
      .populate({
        path: 'car_id',
        select: 'car_registration car_name car_capacity carType',
        populate: {
          path: 'car_type_id',
          select: 'carType_name'
        }
      })
      .populate({
        path: 'driver_id',
        select: 'name employeeId checkInStatus'
      })
      .populate('tickets.ticket_id', 'ticketNumber price ticketType')
      .sort({ booking_date: -1 })
      .skip(skip)
      .limit(limit);
    
    // นับจำนวนทั้งหมด
    const totalItems = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    
    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    });
    
  } catch (error) {
    console.error('Get Bookings Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST - สร้าง Booking ใหม่
export async function POST(request: Request) {
  try {
    // ตรวจสอบ authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { 
      car_registration, 
      passenger_count, 
      tickets, 
      notes,
      expected_departure 
    } = body;
    
    console.log('📋 Booking request:', { car_registration, passenger_count, tickets_count: tickets?.length });
    
    // Validation
    if (!car_registration) {
      return NextResponse.json(
        { error: 'ກະລຸນາເລືອກລົດ' },
        { status: 400 }
      );
    }
    
    if (!passenger_count || passenger_count < 1) {
      return NextResponse.json(
        { error: 'ກະລຸນາລະບຸຈຳນວນຜູ້ໂດຍສານ' },
        { status: 400 }
      );
    }
    
    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'ກະລຸນາແນບຂໍ້ມູນປີ້' },
        { status: 400 }
      );
    }
    
    // ค้นหารถจากทะเบียน
    const car = await Car.findOne({ car_registration })
      .populate('user_id', 'name employeeId checkInStatus');
    
    if (!car) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນລົດ' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าคนขับ check-in แล้วหรือไม่
    if (car.user_id?.checkInStatus !== 'checked-in') {
      return NextResponse.json(
        { error: 'ຄົນຂັບຍັງບໍ່ໄດ້ເຂົ້າວຽກ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่ารถว่างหรือไม่
    const existingBooking = await Booking.findOne({
      car_id: car._id,
      status: { $in: ['booked', 'in_trip'] }
    });
    
    if (existingBooking) {
      return NextResponse.json(
        { error: 'ລົດນີ້ຖືກຈອງແລ້ວ ຫຼື ກຳລັງເດີນທາງ' },
        { status: 409 }
      );
    }
    
    // ตรวจสอบจำนวนผู้โดยสาร
    if (passenger_count > car.car_capacity) {
      return NextResponse.json(
        { error: `ຈຳນວນຜູ້ໂດຍສານເກີນຄວາມຈຸລົດ (ສູງສຸດ ${car.car_capacity} ຄົນ)` },
        { status: 400 }
      );
    }
    
    // เตรียมข้อมูลตั๋ว
    const ticketData = tickets.map((ticket: any) => ({
      ticket_id: ticket._id,
      ticket_number: ticket.ticketNumber,
      passenger_count: ticket.passengerCount || 1,
      ticket_type: ticket.ticketType || 'individual'
    }));
    
    // สร้าง Booking
    const booking = new Booking({
      car_id: car._id,
      driver_id: car.user_id._id,
      booked_by: session.user.email || session.user.name,
      booked_passengers: passenger_count,
      car_capacity: car.car_capacity,
      tickets: ticketData,
      notes: notes,
      expected_departure: expected_departure ? new Date(expected_departure) : undefined
    });
    
    await booking.save();
    
    // Populate ข้อมูลเพื่อส่งกลับ
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'car_id',
        select: 'car_registration car_name car_capacity',
        populate: {
          path: 'car_type_id',
          select: 'carType_name'
        }
      })
      .populate('driver_id', 'name employeeId checkInStatus')
      .populate('tickets.ticket_id', 'ticketNumber price ticketType');
    
    console.log('✅ Booking created successfully:', booking.booking_id);
    
    return NextResponse.json({
      success: true,
      booking: populatedBooking,
      message: `ຈອງລົດສຳເລັດ! ລົດ ${car.car_registration} ສຳລັບ ${passenger_count} ຄົນ`
    });
    
  } catch (error) {
    console.error('Create Booking Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}