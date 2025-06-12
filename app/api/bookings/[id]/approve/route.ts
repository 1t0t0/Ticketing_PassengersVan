// app/api/bookings/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - อนุมัติ/ปฏิเสธ booking
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
    
    const { id } = params;
    const body = await request.json();
    console.log('Booking approval request:', { id, body, user: session.user.email });
    
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
        // อนุมัติการจอง และสร้างตั๋ว
        await booking.approve(session.user.id, adminNotes);
        
        console.log('Booking approved successfully:', {
          bookingNumber: booking.bookingNumber,
          ticketNumbers: booking.ticketNumbers,
          approvedBy: session.user.email
        });
        
        return NextResponse.json({
          success: true,
          booking: booking,
          ticketNumbers: booking.ticketNumbers,
          message: `ອະນຸມັດການຈອງສຳເລັດ! ສ້າງປີ້ເລກທີ: ${booking.ticketNumbers.join(', ')}`
        });
        
      } else {
        // ปฏิเสธการจอง
        await booking.reject(session.user.id, adminNotes);
        
        console.log('Booking rejected:', {
          bookingNumber: booking.bookingNumber,
          rejectedBy: session.user.email,
          reason: adminNotes
        });
        
        return NextResponse.json({
          success: true,
          booking: booking,
          message: 'ປະຕິເສດການຈອງສຳເລັດ'
        });
      }
      
    } catch (approvalError) {
      console.error('Booking approval process error:', approvalError);
      
      // ถ้าเป็นปัญหาการสร้างตั๋ว
      if (approvalError instanceof Error && approvalError.message.includes('ticket')) {
        return NextResponse.json(
          { error: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງປີ້ ກະລຸນາລອງໃໝ່' },
          { status: 500 }
        );
      }
      
      throw approvalError;
    }
    
  } catch (error) {
    console.error('Booking Approval Error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການດຳເນີນການ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - ดึงข้อมูลการอนุมัติ (สำหรับแสดงประวัติ)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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
    
    const { id } = params;
    
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
    
    // ส่งคืนข้อมูলการอนุมัติ
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
    console.error('Get Approval Info Error:', error);
    return NextResponse.json(
      { error: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການອະນຸມັດ' },
      { status: 500 }
    );
  }
}