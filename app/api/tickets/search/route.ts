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
    const paymentMethod = searchParams.get('paymentMethod'); // เพิ่ม parameter สำหรับวิธีการชำระเงิน
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
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
    
    // ถ้ามีการกรองด้วยวิธีการชำระเงิน
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    // นับจำนวนตั๋วทั้งหมดที่ตรงกับเงื่อนไข
    const totalItems = await Ticket.countDocuments(filter);
    
    // คำนวณหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไขและการแบ่งหน้า
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 }) // เรียงจากล่าสุด
      .skip(skip)
      .limit(limit);
    
    // ส่งข้อมูล pagination กลับไปด้วย
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
    console.error('Ticket Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to search tickets' }, 
      { status: 500 }
    );
  }
}