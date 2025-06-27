// app/api/bookings/[id]/route.ts - API สำหรับจัดการ Booking รายตัว
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - ดึงข้อมูล Booking เฉพาะรายการ
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const booking = await Booking.findById(params.id)
      .populate({
        path: 'car_id',
        select: 'car_registration car_name car_capacity',
        populate: {
          path: 'car_type_id',
          select: 'carType_name'
        }
      })
      .populate('driver_id', 'name employeeId checkInStatus phone')
      .populate('tickets.ticket_id', 'ticketNumber price ticketType destination');
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      booking
    });
    
  } catch (error) {
    console.error('Get Booking Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดท Booking
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { action, ...updateData } = body;
    
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    let updatedBooking;
    
    // Handle different actions
    switch (action) {
      case 'start_trip':
        updatedBooking = await Booking.startTrip(params.id);
        break;
        
      case 'complete_trip':
        const { actual_passengers } = updateData;
        updatedBooking = await Booking.completeTrip(params.id, actual_passengers);
        break;
        
      case 'cancel':
        updatedBooking = await Booking.cancelBooking(params.id);
        break;
        
      case 'update':
        // อัพเดทข้อมูลทั่วไป
        Object.assign(booking, updateData);
        updatedBooking = await booking.save();
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
      .populate('driver_id', 'name employeeId checkInStatus')
      .populate('tickets.ticket_id', 'ticketNumber price ticketType');
    
    return NextResponse.json({
      success: true,
      booking: populatedBooking,
      message: getActionMessage(action, booking.booking_id)
    });
    
  } catch (error) {
    console.error('Update Booking Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - ลบ Booking (เฉพาะ admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can delete bookings' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าสามารถลบได้หรือไม่
    if (booking.status === 'in_trip') {
      return NextResponse.json(
        { error: 'ບໍ່ສາມາດລຶບການຈອງທີ່ກຳລັງເດີນທາງ' },
        { status: 400 }
      );
    }
    
    await Booking.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      success: true,
      message: `ລຶບການຈອງ ${booking.booking_id} ສຳເລັດ`
    });
    
  } catch (error) {
    console.error('Delete Booking Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

// Helper function สำหรับสร้างข้อความตอบกลับ
function getActionMessage(action: string, bookingId: string): string {
  switch (action) {
    case 'start_trip':
      return `ເລີ່ມການເດີນທາງ ${bookingId} ສຳເລັດ`;
    case 'complete_trip':
      return `ສິ້ນສຸດການເດີນທາງ ${bookingId} ສຳເລັດ`;
    case 'cancel':
      return `ຍົກເລີກການຈອງ ${bookingId} ສຳເລັດ`;
    case 'update':
      return `ອັບເດດການຈອງ ${bookingId} ສຳເລັດ`;
    default:
      return `ອັບເດດການຈອງ ${bookingId} ສຳເລັດ`;
  }
}