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

    // Validate ข้อมูล
    if (!price || !paymentMethod) {
      return NextResponse.json(
        { error: 'Price and Payment Method are required' }, 
        { status: 400 }
      );
    }

    // สร้าง Ticket Number
    const ticketNumber = `T${Date.now()}`;

    // สร้าง Ticket
    const ticket = await Ticket.create({
      ticketNumber,
      price,
      paymentMethod,
      soldBy: 'System', // แก้ไขตามระบบ Authentication ของคุณ
      soldAt: new Date()
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Ticket Creation Error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' }, 
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
    
    // สร้าง filter
    const filter: any = {};
    
    // ถ้ามีการกรองด้วยวิธีการชำระเงิน
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
    // นับจำนวนตั๋วทั้งหมด
    const totalItems = await Ticket.countDocuments(filter);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไข
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 }) // เรียงจากล่าสุด
      .skip(skip)
      .limit(limit);
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    // ส่งข้อมูลตั๋วและข้อมูล pagination กลับ
    return NextResponse.json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    });
  } catch (error) {
    console.error('Ticket Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' }, 
      { status: 500 }
    );
  }
}