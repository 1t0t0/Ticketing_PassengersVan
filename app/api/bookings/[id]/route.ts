import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงข้อมูลการจองเฉพาะ (แก้ไข async params)
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // 🔧 แก้ไข: await params ก่อนใช้งาน
    const { id } = await context.params;
    console.log('Fetching booking with ID:', id);
    
    // หาการจองด้วย ID หรือ booking number
    let booking;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // MongoDB ObjectId
      booking = await Booking.findById(id);
    } else {
      // Booking Number
      booking = await Booking.findOne({ bookingNumber: id });
    }
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນການຈອງ' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าหมดอายุหรือไม่และอัปเดตสถานะ
    if (booking.isExpired() && booking.status === 'pending') {
      booking.status = 'expired';
      await booking.save();
    }
    
    console.log('Found booking:', booking.bookingNumber, 'Status:', booking.status);
    
    return NextResponse.json(booking);
    
  } catch (error) {
    console.error('Get Booking Error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການຈອງ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูลการจอง (แก้ไข async params)
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // 🔧 แก้ไข: await params ก่อนใช้งาน
    const { id } = await context.params;
    const body = await request.json();
    
    console.log('Updating booking:', id, 'with data:', body);
    
    // หาการจอง
    let booking;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id);
    } else {
      booking = await Booking.findOne({ bookingNumber: id });
    }
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນການຈອງ' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสถานะ
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'ບໍ່ສາມາດແກ້ໄຂການຈອງນີ້ໄດ້ ເພາະວ່າຖືກດຳເນີນການແລ້ວ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าหมดอายุหรือไม่
    if (booking.isExpired()) {
      booking.status = 'expired';
      await booking.save();
      return NextResponse.json(
        { error: 'ການຈອງນີ້ໝົດອາຍຸແລ້ວ' },
        { status: 400 }
      );
    }
    
    // อัปเดตข้อมูลที่อนุญาต
    const allowedUpdates = ['paymentSlip'];
    const updates: any = {};
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'ບໍ່ມີຂໍ້ມູນທີ່ຈະອັບເດດ' },
        { status: 400 }
      );
    }
    
    // ดำเนินการอัปเดต
    Object.assign(booking, updates);
    await booking.save();
    
    console.log('Booking updated successfully:', booking.bookingNumber);
    
    return NextResponse.json(booking);
    
  } catch (error) {
    console.error('Update Booking Error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການອັບເດດການຈອງ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - ยกเลิกการจอง (แก้ไข async params)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'ບໍ່ມີສິດທິ່ລົບການຈອງ' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // 🔧 แก้ไข: await params ก่อนใช้งาน
    const { id } = await context.params;
    
    // หาและลบการจอง
    let booking;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findByIdAndDelete(id);
    } else {
      booking = await Booking.findOneAndDelete({ bookingNumber: id });
    }
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນການຈອງ' },
        { status: 404 }
      );
    }
    
    console.log('Booking deleted:', booking.bookingNumber);
    
    return NextResponse.json({
      success: true,
      message: 'ລົບການຈອງສຳເລັດ',
      deletedBooking: {
        bookingNumber: booking.bookingNumber,
        passengerName: booking.passengerInfo.name
      }
    });
    
  } catch (error) {
    console.error('Delete Booking Error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການລົບການຈອງ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
