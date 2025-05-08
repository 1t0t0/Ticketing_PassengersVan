// app/api/tickets/search/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Recipe from '@/models/Recipe';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // ดึงค่า query parameters
    const { searchParams } = new URL(request.url);
    const ticketNumber = searchParams.get('ticketNumber');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // สร้าง query object สำหรับ MongoDB
    let query: any = {};
    
    // ถ้ามีการระบุเลขตั๋ว
    if (ticketNumber) {
      query.ticketNumber = { $regex: ticketNumber, $options: 'i' };
    }
    
    // ถ้ามีการระบุช่วงวันที่
    if (startDate && endDate) {
      query.soldAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.soldAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.soldAt = { $lte: new Date(endDate) };
    }
    
    // ดึงจำนวนตั๋วทั้งหมดที่ตรงกับเงื่อนไข (สำหรับการแบ่งหน้า)
    const totalTickets = await Ticket.countDocuments(query);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไขการค้นหา
    const tickets = await Ticket.find(query)
      .sort({ soldAt: -1 }) // เรียงจากใหม่ไปเก่า
      .skip(skip)
      .limit(limit);
    
    // ดึงข้อมูลการแบ่งรายได้ของแต่ละตั๋ว (ถ้ามี)
    const ticketsWithRecipe = await Promise.all(
      tickets.map(async (ticket) => {
        const recipe = await Recipe.findOne({ ticket_id: ticket.ticketNumber });
        
        return {
          ...ticket.toObject(),
          recipe: recipe || null,
        };
      })
    );
    
    // ส่งข้อมูลกลับพร้อมข้อมูลการแบ่งหน้า
    return NextResponse.json({
      tickets: ticketsWithRecipe,
      pagination: {
        totalTickets,
        totalPages: Math.ceil(totalTickets / limit),
        currentPage: page,
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