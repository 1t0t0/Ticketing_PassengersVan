// app/api/tickets/route.ts - เพิ่ม Debug Mode
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function POST(request: Request) {
  try {
    // เชื่อมต่อ Database
    await connectDB();

    // ตรวจสอบ Request Body
    const body = await request.json();
    const { price, paymentMethod } = body;

    console.log('Creating ticket with data:', { price, paymentMethod });

    // Validate ข้อมูล
    if (!price || !paymentMethod) {
      return NextResponse.json(
        { error: 'Price and Payment Method are required' }, 
        { status: 400 }
      );
    }

    // สร้าง Ticket Number
    const ticketNumber = `T${Date.now()}`;
    const currentTime = new Date();

    console.log('Generated ticket number:', ticketNumber);
    console.log('Current time:', currentTime);

    // สร้าง Ticket
    const ticketData = {
      ticketNumber,
      price,
      paymentMethod,
      soldBy: 'System',
      soldAt: currentTime
    };

    console.log('Creating ticket with full data:', ticketData);

    const ticket = await Ticket.create(ticketData);

    console.log('Ticket created successfully:', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      soldAt: ticket.soldAt,
      price: ticket.price
    });

    // **Debug: ตรวจสอบว่าตั๋วถูกบันทึกจริงหรือไม่**
    const savedTicket = await Ticket.findById(ticket._id);
    console.log('Verified saved ticket:', savedTicket);

    return NextResponse.json(ticket);
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
    await connectDB();
    
    // รับค่า query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const paymentMethod = searchParams.get('paymentMethod');
    
    console.log('GET tickets request:', { page, limit, paymentMethod });
    
    // สร้าง filter
    const filter: any = {};
    
    // ถ้ามีการกรองด้วยวิธีการชำระเงิน
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    console.log('Using filter:', filter);
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
    // นับจำนวนตั๋วทั้งหมด
    const totalItems = await Ticket.countDocuments(filter);
    console.log('Total tickets found:', totalItems);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไข
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 }) // เรียงจากล่าสุด
      .skip(skip)
      .limit(limit);
    
    console.log('Retrieved tickets:', tickets.length);
    if (tickets.length > 0) {
      console.log('Sample ticket:', {
        id: tickets[0]._id,
        ticketNumber: tickets[0].ticketNumber,
        soldAt: tickets[0].soldAt,
        price: tickets[0].price
      });
    }
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    const result = {
      tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    };
    
    console.log('Returning tickets response:', {
      ticketCount: result.tickets.length,
      totalItems: result.pagination.totalItems,
      currentPage: result.pagination.currentPage
    });
    
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