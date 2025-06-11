// app/api/bookings/[id]/route.ts - API สำหรับจัดการการจองแต่ละรายการ
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import BookingTicket from '@/models/BookingTicket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { formatDateLao, formatTimeRemaining } from '@/lib/bookingUtils';

// GET - ดึงข้อมูลการจองเฉพาะรายการ
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const includeTickets = searchParams.get('include_tickets') === 'true';
    const publicView = searchParams.get('public') === 'true'; // สำหรับหน้าเช็คสถานะ
    
    console.log(`📋 Fetching booking details: ${params.id}`);
    
    // หาการจอง
    const booking = await Booking.findById(params.id)
      .populate('approved_by', 'name email employeeId');
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจองนี้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!publicView) {
      const session = await getServerSession(authOptions);
      if (!session || !['admin', 'staff'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'Unauthorized - Only admin and staff can view booking details' },
          { status: 401 }
        );
      }
    }
    
    // ดึงตั๋วที่เกี่ยวข้อง (ถ้าต้องการ)
    let tickets = null;
    if (includeTickets) {
      tickets = await BookingTicket.findByBookingId(params.id);
    }
    
    // สร้างข้อมูลที่จะส่งกลับ
    const bookingData = {
      id: booking._id,
      booking_id: booking.booking_id,
      booking_date: booking.booking_date,
      travel_date: booking.travel_date,
      travel_date_formatted: formatDateLao(booking.travel_date),
      total_tickets: booking.total_tickets,
      total_price: booking.total_price,
      price_per_ticket: booking.price_per_ticket,
      
      // ข้อมูลผู้จอง
      booker_email: booking.booker_email,
      booker_name: booking.booker_name,
      booker_phone: booking.booker_phone,
      passenger_emails: booking.passenger_emails,
      
      // สถานะและการอนุมัติ
      status: booking.status,
      status_text: booking.statusText,
      payment_slip: booking.payment_slip,
      approved_by: booking.approved_by ? {
        name: booking.approved_by.name,
        email: booking.approved_by.email,
        employee_id: booking.approved_by.employeeId
      } : null,
      approved_at: booking.approved_at,
      cancelled_at: booking.cancelled_at,
      cancel_reason: booking.cancel_reason,
      admin_notes: booking.admin_notes,
      
      // เวลาและการหมดอายุ
      expires_at: booking.expires_at,
      time_remaining: booking.getTimeRemaining(),
      time_remaining_text: formatTimeRemaining(booking.getTimeRemaining()),
      is_expired: booking.isExpired(),
      
      // สิทธิ์การดำเนินการ
      can_cancel: booking.canCancel(),
      can_approve: booking.canApprove(),
      is_active: booking.isActive,
      
      // เวลาสร้างและอัปเดต
      created_at: booking.created_at,
      updated_at: booking.updated_at
    };
    
    // เพิ่มข้อมูลตั๋ว (ถ้าต้องการ)
    if (tickets) {
      bookingData.tickets = tickets.map(ticket => ({
        id: ticket._id,
        ticket_code: ticket.ticket_code,
        passenger_order: ticket.passenger_order,
        passenger_email: ticket.passenger_email,
        status: ticket.status,
        status_text: ticket.statusText,
        qr_code_data: ticket.qr_code_data,
        valid_from: ticket.valid_from,
        valid_until: ticket.valid_until,
        used_by: ticket.used_by ? {
          name: ticket.used_by.name,
          employee_id: ticket.used_by.employeeId
        } : null,
        used_at: ticket.used_at,
        email_sent: ticket.email_sent,
        email_sent_at: ticket.email_sent_at,
        is_usable: ticket.isUsable(),
        is_expired: ticket.isExpired(),
        can_scan: ticket.canScan()
      }));
    }
    
    console.log(`✅ Retrieved booking: ${booking.booking_id} (${booking.status})`);
    
    return NextResponse.json({
      success: true,
      booking: bookingData
    });
    
  } catch (error) {
    console.error('💥 Get booking detail error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตการจอง
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ - เฉพาะ Admin และ Staff เท่านั้น
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only admin and staff can update bookings' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const body = await request.json();
    const { action, admin_notes, cancel_reason } = body;
    
    console.log(`🔄 Updating booking ${params.id}, action: ${action}`);
    
    // หาการจอง
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจองนี้' },
        { status: 404 }
      );
    }
    
    let updateData: any = {};
    let message = '';
    
    switch (action) {
      case 'add_notes':
        // เพิ่มหมายเหตุ
        updateData.admin_notes = admin_notes;
        message = 'เพิ่มหมายเหตุสำเร็จ';
        break;
        
      case 'cancel':
        // ยกเลิกการจอง
        if (!booking.canCancel()) {
          return NextResponse.json(
            { error: 'ไม่สามารถยกเลิกการจองนี้ได้' },
            { status: 400 }
          );
        }
        
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date(),
          cancel_reason: cancel_reason || 'ยกเลิกโดย Admin',
          admin_notes: admin_notes
        };
        
        // อัปเดตตั๋วที่เกี่ยวข้อง
        await BookingTicket.updateMany(
          { booking_id: params.id },
          { $set: { status: 'cancelled' } }
        );
        
        message = 'ยกเลิกการจองสำเร็จ';
        break;
        
      default:
        return NextResponse.json(
          { error: 'การดำเนินการไม่ถูกต้อง' },
          { status: 400 }
        );
    }
    
    // อัปเดตการจอง
    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).populate('approved_by', 'name email employeeId');
    
    console.log(`✅ Booking updated: ${booking.booking_id} - ${action}`);
    
    return NextResponse.json({
      success: true,
      message: message,
      booking: {
        id: updatedBooking._id,
        booking_id: updatedBooking.booking_id,
        status: updatedBooking.status,
        status_text: updatedBooking.statusText,
        admin_notes: updatedBooking.admin_notes,
        cancelled_at: updatedBooking.cancelled_at,
        cancel_reason: updatedBooking.cancel_reason,
        updated_at: updatedBooking.updated_at
      }
    });
    
  } catch (error) {
    console.error('💥 Update booking error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการอัปเดตการจอง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - ลบการจอง (Admin เท่านั้น)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ - เฉพาะ Admin เท่านั้น
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admin can delete bookings' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    console.log(`🗑️ Deleting booking: ${params.id}`);
    
    // หาการจอง
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจองนี้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบว่าสามารถลบได้หรือไม่
    if (booking.status === 'approved') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบการจองที่อนุมัติแล้ว' },
        { status: 400 }
      );
    }
    
    // ลบตั๋วที่เกี่ยวข้อง
    await BookingTicket.deleteMany({ booking_id: params.id });
    
    // ลบการจอง
    await Booking.findByIdAndDelete(params.id);
    
    console.log(`✅ Deleted booking: ${booking.booking_id}`);
    
    return NextResponse.json({
      success: true,
      message: `ลบการจอง ${booking.booking_id} สำเร็จ`,
      deleted_booking: {
        booking_id: booking.booking_id,
        booker_email: booking.booker_email,
        total_price: booking.total_price,
        status: booking.status
      }
    });
    
  } catch (error) {
    console.error('💥 Delete booking error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการลบการจอง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}