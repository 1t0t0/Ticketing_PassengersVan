// สร้างไฟล์ใหม่ app/api/tickets/[id]/payment-method/route.ts

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions, checkUserPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/authUtils';

// PUT - อัปเดตวิธีการชำระเงินของตั๋ว
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ในการแก้ไขตั๋ว
    if (!checkUserPermission(session, PERMISSIONS.SELL_TICKET)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // เชื่อมต่อ Database
    await connectDB();
    
    // รับข้อมูลจาก request
    const body = await request.json();
    const { paymentMethod } = body;
    
    // ตรวจสอบความถูกต้องของข้อมูล
    if (!paymentMethod || !['cash', 'qr'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be "cash" or "qr"' },
        { status: 400 }
      );
    }
    
    // อัปเดตวิธีการชำระเงินของตั๋ว
    const updatedTicket = await Ticket.findByIdAndUpdate(
      params.id,
      { paymentMethod },
      { new: true }
    );
    
    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // บันทึกประวัติการแก้ไขตั๋ว (ถ้ามี logging system)
    // await AuditLog.create({
    //   action: 'update_ticket_payment_method',
    //   ticketId: params.id,
    //   ticketNumber: updatedTicket.ticketNumber,
    //   performedBy: session.user.id,
    //   performedAt: new Date(),
    //   oldValue: body.oldPaymentMethod,
    //   newValue: paymentMethod
    // });
    
    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket payment method' },
      { status: 500 }
    );
  }
}