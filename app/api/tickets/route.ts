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

export async function GET() {
  try {
    await connectDB();
    
    // ดึงตั๋ว 10 อันดับแรก เรียงจากล่าสุด
    const tickets = await Ticket.find()
      .sort({ soldAt: -1 })
      .limit(10);
    
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Ticket Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' }, 
      { status: 500 }
    );
  }
}