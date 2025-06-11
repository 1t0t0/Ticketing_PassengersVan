// app/api/bookings/route.ts - API สำหรับจัดการการจอง
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import BookingTicket from '@/models/BookingTicket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  validateBookingData, 
  calculateBookingPrice, 
  BOOKING_CONSTANTS,
  generateBookingSummary
} from '@/lib/bookingUtils';

// POST - สร้างการจองใหม่
export async function POST(request: Request) {
  try {
    await connectDB();
    
    console.log('📝 Creating new booking...');
    
    // รับข้อมูลจาก request
    const body = await request.json();
    console.log('Request data:', {
      ...body,
      passengerEmails: body.passengerEmails?.length || 0
    });
    
    const {
      travel_date,
      total_tickets,
      booker_email,
      booker_name,
      booker_phone,
      passenger_emails,
      discount_code
    } = body;
    
    // ตรวจสอบข้อมูลที่ส่งมา
    const validation = validateBookingData({
      travelDate: travel_date,
      ticketCount: total_tickets,
      bookerEmail: booker_email,
      passengerEmails: passenger_emails,
      bookerName: booker_name,
      bookerPhone: booker_phone
    });
    
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors);
      return NextResponse.json(
        { 
          error: 'ข้อมูลการจองไม่ถูกต้อง',
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }
    
    // คำนวณราคา
    const pricing = calculateBookingPrice(total_tickets, travel_date, discount_code);
    console.log('💰 Calculated pricing:', pricing);
    
    // สร้าง booking ID
    const bookingId = await Booking.generateBookingId();
    console.log('🎫 Generated booking ID:', bookingId);
    
    // กำหนดวันหมดอายุ (24 ชั่วโมงหลังสร้างการจอง)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + BOOKING_CONSTANTS.EXPIRY_HOURS);
    
    // สร้างข้อมูลการจอง
    const bookingData = {
      booking_id: bookingId,
      travel_date,
      total_tickets,
      total_price: pricing.totalPrice,
      price_per_ticket: pricing.pricePerTicket,
      booker_email: booker_email.toLowerCase().trim(),
      booker_name: booker_name?.trim(),
      booker_phone: booker_phone?.trim(),
      passenger_emails: passenger_emails.map((email: string) => email.toLowerCase().trim()),
      expires_at: expiresAt,
      status: 'pending'
    };
    
    console.log('📋 Creating booking with data:', {
      ...bookingData,
      passenger_emails: `${bookingData.passenger_emails.length} emails`
    });
    
    // บันทึกการจอง
    const booking = await Booking.create(bookingData);
    console.log('✅ Booking created successfully:', booking._id);
    
    // สร้างตั๋วแต่ละใบ (ยังไม่ส่ง Email)
    console.log('🎫 Creating individual tickets...');
    const tickets = await BookingTicket.createTicketsForBooking(booking);
    console.log(`✅ Created ${tickets.length} tickets`);
    
    // สร้างข้อความสรุปการจอง
    const summary = generateBookingSummary({
      booking_id: bookingId,
      travel_date,
      total_tickets,
      total_price: pricing.totalPrice,
      passenger_emails: passenger_emails
    });
    
    // ส่งข้อมูลกลับ
    const response = {
      success: true,
      booking: {
        id: booking._id,
        booking_id: bookingId,
        travel_date,
        total_tickets,
        total_price: pricing.totalPrice,
        price_per_ticket: pricing.pricePerTicket,
        booker_email: booker_email,
        passenger_emails: passenger_emails,
        status: 'pending',
        expires_at: expiresAt,
        created_at: booking.created_at
      },
      pricing: pricing,
      summary: summary,
      next_step: {
        action: 'upload_payment_slip',
        url: `/booking/payment/${booking._id}`,
        message: 'กรุณาอัปโหลดสลิปการโอนเงินภายใน 24 ชั่วโมง'
      },
      payment_info: {
        bank_name: 'ທະນາຄານ BCEL',
        account_number: '1234567890',
        account_name: 'ບໍລິສັດ ລົດເມ ລາວ',
        amount: pricing.totalPrice,
        reference: bookingId
      },
      warnings: validation.warnings
    };
    
    console.log('🎉 Booking process completed successfully');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Booking creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการสร้างการจอง',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET - ดึงรายการการจอง
export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์ - เฉพาะ Admin และ Staff เท่านั้น
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only admin and staff can view bookings' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const travel_date = searchParams.get('travel_date');
    const booker_email = searchParams.get('booker_email');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;
    
    console.log('📊 Fetching bookings with filters:', {
      status, travel_date, booker_email, page, limit, sort, order
    });
    
    // สร้าง query filter
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (travel_date) {
      filter.travel_date = travel_date;
    }
    
    if (booker_email) {
      filter.booker_email = { $regex: booker_email, $options: 'i' };
    }
    
    // คำนวณ pagination
    const skip = (page - 1) * limit;
    
    // ดึงข้อมูลการจอง
    const [bookings, totalCount] = await Promise.all([
      Booking.find(filter)
        .populate('approved_by', 'name email employeeId')
        .sort({ [sort]: order })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter)
    ]);
    
    console.log(`📋 Found ${bookings.length} bookings (${totalCount} total)`);
    
    // คำนวณสถิติเพิ่มเติม
    const stats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total_price' },
          totalTickets: { $sum: '$total_tickets' }
        }
      }
    ]);
    
    // ฟอร์แมตข้อมูลการจอง
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      booking_id: booking.booking_id,
      travel_date: booking.travel_date,
      total_tickets: booking.total_tickets,
      total_price: booking.total_price,
      booker_email: booking.booker_email,
      booker_name: booking.booker_name,
      status: booking.status,
      status_text: booking.statusText,
      payment_slip: booking.payment_slip,
      expires_at: booking.expires_at,
      time_remaining: booking.getTimeRemaining(),
      can_cancel: booking.canCancel(),
      can_approve: booking.canApprove(),
      approved_by: booking.approved_by ? {
        name: booking.approved_by.name,
        email: booking.approved_by.email,
        employee_id: booking.approved_by.employeeId
      } : null,
      approved_at: booking.approved_at,
      created_at: booking.created_at,
      updated_at: booking.updated_at
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      success: true,
      bookings: formattedBookings,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      stats: stats,
      filters: {
        status,
        travel_date,
        booker_email,
        sort,
        order: order === 1 ? 'asc' : 'desc'
      }
    });
    
  } catch (error) {
    console.error('💥 Get bookings error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - ลบการจองที่หมดอายุ (Admin only)
export async function DELETE(request: Request) {
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
    
    console.log('🗑️ Starting cleanup of expired bookings...');
    
    // หาการจองที่หมดอายุ
    const expiredBookings = await Booking.findExpiredBookings();
    console.log(`Found ${expiredBookings.length} expired bookings`);
    
    if (expiredBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ไม่มีการจองที่หมดอายุ',
        deleted_count: 0
      });
    }
    
    // อัปเดตสถานะเป็น expired แทนการลบ
    const updateResult = await Booking.updateMany(
      { 
        status: 'pending',
        expires_at: { $lt: new Date() }
      },
      { 
        $set: { 
          status: 'expired',
          cancelled_at: new Date(),
          cancel_reason: 'หมดเวลาชำระเงิน'
        }
      }
    );
    
    // อัปเดตตั๋วที่เกี่ยวข้อง
    const expiredBookingIds = expiredBookings.map(b => b._id);
    await BookingTicket.updateMany(
      { booking_id: { $in: expiredBookingIds } },
      { $set: { status: 'expired' } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} expired bookings`);
    
    return NextResponse.json({
      success: true,
      message: `อัปเดตการจองที่หมดอายุ ${updateResult.modifiedCount} รายการ`,
      expired_bookings: expiredBookings.map(b => ({
        booking_id: b.booking_id,
        booker_email: b.booker_email,
        total_price: b.total_price,
        expires_at: b.expires_at
      })),
      deleted_count: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('💥 Cleanup expired bookings error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการลบการจองที่หมดอายุ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}