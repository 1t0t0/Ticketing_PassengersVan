// app/api/driver/booking/route.ts - API สำหรับคนขับดู Booking ของตัวเอง
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Car from '@/models/Car';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงข้อมูล Booking ของคนขับ
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active'; // active, all, completed
    
    // ดึงข้อมูลรถของคนขับ
    const driverCar = await Car.findOne({ user_id: driverId })
      .populate('car_type_id', 'carType_name');
    
    if (!driverCar) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນລົດຂອງພະນັກງານຂັບລົດ' },
        { status: 404 }
      );
    }
    
    // สร้าง filter ตามสถานะ
    let filter: any = { driver_id: driverId };
    
    switch (status) {
      case 'active':
        filter.status = { $in: ['booked', 'in_trip'] };
        break;
      case 'completed':
        filter.status = 'completed';
        break;
      case 'cancelled':
        filter.status = 'cancelled';
        break;
      // 'all' ไม่เพิ่ม filter status
    }
    
    // ดึงข้อมูล bookings
    const bookings = await Booking.find(filter)
      .populate({
        path: 'car_id',
        select: 'car_registration car_name car_capacity',
        populate: {
          path: 'car_type_id',
          select: 'carType_name'
        }
      })
      .populate('tickets.ticket_id', 'ticketNumber price ticketType destination')
      .sort({ booking_date: -1 })
      .limit(20);
    
    // หา active booking (สำหรับแสดงสถานะปัจจุบัน)
    const activeBooking = await Booking.findOne({
      driver_id: driverId,
      status: { $in: ['booked', 'in_trip'] }
    }).populate({
      path: 'car_id',
      select: 'car_registration car_name car_capacity',
      populate: {
        path: 'car_type_id',
        select: 'carType_name'
      }
    })
    .populate('tickets.ticket_id', 'ticketNumber price ticketType destination');
    
    // คำนวณสถิติ
    const stats = await Booking.aggregate([
      { $match: { driver_id: new (require('mongoose').Types.ObjectId)(driverId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPassengers: { $sum: '$booked_passengers' }
        }
      }
    ]);
    
    const formattedStats = {
      booked: { count: 0, totalPassengers: 0 },
      in_trip: { count: 0, totalPassengers: 0 },
      completed: { count: 0, totalPassengers: 0 },
      cancelled: { count: 0, totalPassengers: 0 },
      total: { count: 0, totalPassengers: 0 }
    };
    
    stats.forEach(stat => {
      if (formattedStats[stat._id as keyof typeof formattedStats]) {
        formattedStats[stat._id as keyof typeof formattedStats] = {
          count: stat.count,
          totalPassengers: stat.totalPassengers
        };
      }
    });
    
    // คำนวณรวม
    Object.values(formattedStats).forEach(item => {
      if (item !== formattedStats.total) {
        formattedStats.total.count += item.count;
        formattedStats.total.totalPassengers += item.totalPassengers;
      }
    });
    
    return NextResponse.json({
      success: true,
      driver: {
        id: driverId,
        name: session.user.name,
        car: {
          id: driverCar._id,
          registration: driverCar.car_registration,
          name: driverCar.car_name,
          capacity: driverCar.car_capacity,
          type: driverCar.car_type_id?.carType_name || 'Unknown'
        }
      },
      activeBooking: activeBooking,
      bookings: bookings,
      stats: formattedStats,
      hasActiveBooking: !!activeBooking,
      currentStatus: activeBooking ? activeBooking.status : 'free'
    });
    
  } catch (error) {
    console.error('Get Driver Booking Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch driver booking data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - คนขับทำการ action กับ booking ของตัวเอง
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
    const body = await request.json();
    const { action, booking_id, actual_passengers } = body;
    
    console.log('🚗 Driver action:', { driverId, action, booking_id });
    
    // ตรวจสอบว่า booking นี้เป็นของคนขับคนนี้
    const booking = await Booking.findOne({
      _id: booking_id,
      driver_id: driverId
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນການຈອງ ຫຼື ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ' },
        { status: 404 }
      );
    }
    
    let updatedBooking;
    let message = '';
    
    switch (action) {
      case 'start_trip':
        if (booking.status !== 'booked') {
          return NextResponse.json(
            { error: 'ການຈອງນີ້ບໍ່ສາມາດເລີ່ມການເດີນທາງໄດ້' },
            { status: 400 }
          );
        }
        updatedBooking = await Booking.startTrip(booking_id);
        message = 'ເລີ່ມການເດີນທາງສຳເລັດ';
        break;
        
      case 'complete_trip':
        if (booking.status !== 'in_trip') {
          return NextResponse.json(
            { error: 'ການຈອງນີ້ບໍ່ສາມາດສິ້ນສຸດການເດີນທາງໄດ້' },
            { status: 400 }
          );
        }
        updatedBooking = await Booking.completeTrip(booking_id, actual_passengers);
        message = 'ສິ້ນສຸດການເດີນທາງສຳເລັດ';
        break;
        
      case 'cancel':
        if (booking.status === 'completed') {
          return NextResponse.json(
            { error: 'ບໍ່ສາມາດຍົກເລີກການຈອງທີ່ສຳເລັດແລ້ວ' },
            { status: 400 }
          );
        }
        updatedBooking = await Booking.cancelBooking(booking_id);
        message = 'ຍົກເລີກການຈອງສຳເລັດ';
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    // Populate ข้อมูลเพื่อส่งกลับ
    const populatedBooking = await Booking.findById(updatedBooking._id)
      .populate({
        path: 'car_id',
        select: 'car_registration car_name car_capacity',
        populate: {
          path: 'car_type_id',
          select: 'carType_name'
        }
      })
      .populate('tickets.ticket_id', 'ticketNumber price ticketType destination');
    
    console.log('✅ Driver action completed:', { action, booking_id, newStatus: updatedBooking.status });
    
    return NextResponse.json({
      success: true,
      booking: populatedBooking,
      message: message,
      action: action,
      newStatus: updatedBooking.status
    });
    
  } catch (error) {
    console.error('Driver Booking Action Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}