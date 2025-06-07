// app/api/tickets/route.ts - Complete file with short ticket numbers (No Income)
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ฟังก์ชันสร้าง Ticket Number แบบ Sequential Counter (Reset ทุกวัน)
async function generateSequentialTicketNumber(): Promise<string> {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  console.log('Generating sequential ticket number for date:', todayStart.toISOString().split('T')[0]);
  
  // หาตั๋วล่าสุดของวันนี้ที่มีรูปแบบ T + 5 หลักเท่านั้น (T00001, T00002, ...)
  const latestTodayTicket = await Ticket.findOne({
    soldAt: {
      $gte: todayStart,
      $lte: todayEnd
    },
    ticketNumber: { $regex: /^T\d{5}$/ } // เฉพาะรูปแบบ T + 5 หลักตัวเลข
  }).sort({ soldAt: -1 });
  
  let sequence = 1;
  
  if (latestTodayTicket?.ticketNumber) {
    console.log('Latest NEW format ticket found:', latestTodayTicket.ticketNumber);
    // ดึงเลขลำดับจาก ticket number ล่าสุด (T00001 -> 1)
    const match = latestTodayTicket.ticketNumber.match(/^T(\d{5})$/);
    if (match) {
      const lastNumber = parseInt(match[1]);
      sequence = lastNumber + 1;
      console.log('Next sequence:', sequence);
    }
  } else {
    console.log('No NEW format tickets found for today, starting with sequence 1');
  }
  
  // แปลงเป็นรูปแบบ T + เลขลำดับ 5 หลัก (T00001, T00002, ...)
  const paddedSequence = sequence.toString().padStart(5, '0');
  const ticketNumber = `T${paddedSequence}`;
  
  console.log('Generated ticket number:', ticketNumber);
  return ticketNumber;
};
  


export async function POST(request: Request) {
  try {
    // ตรวจสอบ session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // เชื่อมต่อ Database
    await connectDB();

    // ตรวจสอบ Request Body
    const body = await request.json();
    const { price, paymentMethod } = body;

    console.log('Creating ticket with new system:', { 
      price, 
      paymentMethod, 
      soldBy: session.user.email 
    });

    // Validate ข้อมูล
    if (!price || !paymentMethod) {
      return NextResponse.json(
        { error: 'Price and Payment Method are required' }, 
        { status: 400 }
      );
    }

    // สร้าง Ticket Number แบบสั้น (Sequential)
    const ticketNumber = await generateSequentialTicketNumber();
    const currentTime = new Date();
    const soldBy = session.user.email || session.user.name || 'System';

    console.log('=== NEW TICKET CREATION ===');
    console.log('Generated ticket number:', ticketNumber);
    console.log('Current time:', currentTime);

    // สร้าง Ticket
    const ticketData = {
      ticketNumber,
      price,
      paymentMethod,
      soldBy,
      soldAt: currentTime
    };

    console.log('Creating ticket with data:', ticketData);

    const ticket = await Ticket.create(ticketData);

    console.log('✅ Ticket created successfully:', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      soldAt: ticket.soldAt,
      price: ticket.price
    });

    // ส่งคืน ticket ธรรมดา ไม่มี Income
    return NextResponse.json(ticket.toObject());

  } catch (error) {
    console.error('Ticket Creation Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // ตรวจสอบ session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // รับค่า query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const paymentMethod = searchParams.get('paymentMethod');
    const includeRevenue = searchParams.get('includeRevenue') === 'true';
    
    console.log('GET tickets request:', { page, limit, paymentMethod, includeRevenue });
    
    // สร้าง filter
    const filter: any = {};
    
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
    // นับจำนวนตั๋วทั้งหมด
    const totalItems = await Ticket.countDocuments(filter);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไข
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 })
      .skip(skip)
      .limit(limit);
    
    let ticketsWithRevenue = tickets;
    
    // ถ้าต้องการข้อมูล revenue ด้วย (ไม่ใช้แล้ว - ไม่มี Income model)
    if (includeRevenue) {
      console.log('Income model removed - skipping revenue data');
    }
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    const result = {
      tickets: ticketsWithRevenue,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      },
      meta: {
        includeRevenue: false, // ไม่มี Income model แล้ว
        hasRevenueData: false
      }
    };
    
    // ส่งข้อมูลตั๋วและข้อมูล pagination กลับ
    return NextResponse.json(result);
  } catch (error) {
    console.error('Ticket Fetch Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}