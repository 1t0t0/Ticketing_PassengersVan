// app/api/tickets/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions,checkUserPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/authUtils';

// API สำหรับดึงข้อมูลตั๋วเฉพาะตาม ID
export async function GET(
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

    // เชื่อมต่อ Database
    await connectDB();
    
    // ดึงข้อมูลตั๋วตาม ID
    const ticket = await Ticket.findById(params.id);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Ticket Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

// API สำหรับลบตั๋ว
export async function DELETE(
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

    // ตรวจสอบสิทธิ์ในการลบตั๋ว
    // ผู้ใช้ต้องมีสิทธิ์ SELL_TICKET (สามารถแก้ไขได้ตามสิทธิ์ที่เหมาะสม)
    if (!checkUserPermission(session, PERMISSIONS.SELL_TICKET)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // เชื่อมต่อ Database
    await connectDB();
    
    // ลบตั๋วตาม ID
    const result = await Ticket.findByIdAndDelete(params.id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }
    
    // บันทึกประวัติการลบตั๋ว (ถ้ามี logging system)
    // await AuditLog.create({
    //   action: 'delete_ticket',
    //   ticketId: params.id,
    //   ticketNumber: result.ticketNumber,
    //   performedBy: session.user.id,
    //   performedAt: new Date()
    // });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ticket Delete Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}