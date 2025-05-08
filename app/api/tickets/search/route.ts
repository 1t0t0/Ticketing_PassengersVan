// app/api/tickets/search/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function GET(request: Request) {
  try {
    // เชื่อมต่อ Database
    await connectDB();
    
    // รับ parameters จาก URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const date = searchParams.get('date');
    
    // สร้าง filter object
    const filter: any = {};
    
    // ถ้ามีการค้นหาด้วย query (ticketNumber หรือ soldBy)
    if (query) {
      filter['$or'] = [
        { ticketNumber: { $regex: query, $options: 'i' } },
        { soldBy: { $regex: query, $options: 'i' } }
      ];
    }
    
    // ถ้ามีการค้นหาด้วยวันที่
    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      
      filter.soldAt = {
        $gte: selectedDate,
        $lt: nextDay
      };
    }
    
    // ค้นหาตั๋วตามเงื่อนไข
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 })
      .limit(100); // จำกัดผลลัพธ์ไม่เกิน 100 รายการ
    
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Ticket Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to search tickets' }, 
      { status: 500 }
    );
  }
}