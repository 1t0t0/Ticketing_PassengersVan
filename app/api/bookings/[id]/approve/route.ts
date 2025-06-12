// app/api/bookings/[id]/approve/route.ts - Fixed API Route
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - อนุมัติ/ปฏิเสธ booking
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin และ staff)
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'ບໍ່ມີສິດທິ່ອະນຸມັດການຈອງ' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // ✅ แก้ไข: await params ก่อนใช้งาน
    const { id } = await context.params;
    
    const body = await request.json();
    console.log('🎯 Booking approval request:', { id, body, user: session.user.email });
    
    const { action, adminNotes } = body;
    
    // ตรวจสอบ action
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'ກະລຸນາເລືອກການດຳເນີນການ (ອະນຸມັດ ຫຼື ປະຕິເສດ)' },
        { status: 400 }
      );
    }
    
    // หา booking
    let booking;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id);
    } else {
      booking = await Booking.findOne({ bookingNumber: id });
    }
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບການຈອງນີ້' },
        { status: 404 }
      );
    }
    
    console.log('📋 Found booking:', {
      id: booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      hasPaymentSlip: !!booking.paymentSlip
    });
    
    // ตรวจสอบสถานะ
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: `ການຈອງນີ້ໄດ້ຖືກດຳເນີນການແລ້ວ (${booking.statusLao})` },
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
    
    // ตรวจสอบว่ามีสลิปการโอนเงินหรือไม่ (สำหรับการอนุมัติ)
    if (action === 'approve' && !booking.paymentSlip) {
      return NextResponse.json(
        { error: 'ກະລຸນາໃຫ້ລູກຄ້າອັບໂຫລດສລິບການໂອນເງິນກ່ອນ' },
        { status: 400 }
      );
    }
    
    try {
      if (action === 'approve') {
        console.log('✅ Starting approval process...');
        
        // ✅ เรียกใช้ instance method ที่เพิ่มใหม่
        const approvedBooking = await booking.approve(session.user.id, adminNotes);
        
        console.log('🎉 Booking approved successfully:', {
          bookingNumber: approvedBooking.bookingNumber,
          ticketNumbers: approvedBooking.ticketNumbers,
          approvedBy: session.user.email
        });
        
        return NextResponse.json({
          success: true,
          booking: approvedBooking,
          ticketNumbers: approvedBooking.ticketNumbers,
          message: `ອະນຸມັດການຈອງສຳເລັດ! ສ້າງປີ້ເລກທີ: ${approvedBooking.ticketNumbers.join(', ')}`
        });
        
      } else {
        console.log('❌ Starting rejection process...');
        
        // ✅ เรียกใช้ instance method ที่เพิ่มใหม่
        const rejectedBooking = await booking.reject(session.user.id, adminNotes);
        
        console.log('✅ Booking rejected:', {
          bookingNumber: rejectedBooking.bookingNumber,
          rejectedBy: session.user.email,
          reason: adminNotes
        });
        
        return NextResponse.json({
          success: true,
          booking: rejectedBooking,
          message: 'ປະຕິເສດການຈອງສຳເລັດ'
        });
      }
      
    } catch (approvalError) {
      console.error('❌ Booking approval process error:', approvalError);
      
      // จัดการ error ตามประเภท
      if (approvalError instanceof Error) {
        if (approvalError.message.includes('ticket') || approvalError.message.includes('ตั๋ว')) {
          return NextResponse.json(
            { error: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງປີ້ ກະລຸນາລອງໃໝ່' },
            { status: 500 }
          );
        }
        
        if (approvalError.message.includes('หมดอายุ') || approvalError.message.includes('expired')) {
          return NextResponse.json(
            { error: 'ການຈອງນີ້ໝົດອາຍຸແລ້ວ' },
            { status: 400 }
          );
        }
        
        // Error อื่นๆ
        return NextResponse.json(
          { error: approvalError.message },
          { status: 400 }
        );
      }
      
      // Unknown error
      throw approvalError;
    }
    
  } catch (error) {
    console.error('❌ Booking Approval Error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການດຳເນີນການ',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}

// GET - ดึงข้อมูลการอนุมัติ (สำหรับแสดงประวัติ)
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ตรวจสอบสิทธิ์
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'ບໍ່ມີສິດທິ່ເບິ່ງຂໍ້ມູນການອະນຸມັດ' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // ✅ แก้ไข: await params ก่อนใช้งาน
    const { id } = await context.params;
    
    // หา booking พร้อมข้อมูลผู้อนุมัติ
    let booking;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id)
        .populate('approvedBy', 'name email employeeId');
    } else {
      booking = await Booking.findOne({ bookingNumber: id })
        .populate('approvedBy', 'name email employeeId');
    }
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບການຈອງນີ້' },
        { status: 404 }
      );
    }
    
    // ส่งคืนข้อมูลการอนุมัติ
    const approvalInfo = {
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      statusLao: booking.statusLao,
      approvedBy: booking.approvedBy,
      approvedAt: booking.approvedAt,
      adminNotes: booking.adminNotes,
      ticketNumbers: booking.ticketNumbers,
      canApprove: booking.status === 'pending' && !booking.isExpired(),
      hasPaymentSlip: !!booking.paymentSlip
    };
    
    return NextResponse.json(approvalInfo);
    
  } catch (error) {
    console.error('❌ Get Approval Info Error:', error);
    return NextResponse.json(
      { error: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການອະນຸມັດ' },
      { status: 500 }
    );
  }
}