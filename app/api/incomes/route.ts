// app/api/incomes/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - Create a new income record
export async function POST(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Parse request body
    const body = await request.json();
    const { ticket_id, user_id, income_amount } = body;
    
    // Validate required fields
    if (!ticket_id || !user_id || !income_amount) {
      return NextResponse.json(
        { error: 'Ticket ID, User ID, and Income Amount are required' },
        { status: 400 }
      );
    }
    
    // Check if income record already exists for this ticket
    const existingIncome = await Income.findByTicketId(ticket_id);
    if (existingIncome) {
      return NextResponse.json(
        { error: 'Income record for this ticket already exists' },
        { status: 409 }
      );
    }
    
    // Create income ID
    const income_id = `INC${Date.now()}`;
    
    // Create income record
    const newIncome = new Income({
      income_id,
      ticket_id,
      user_id,
      income_amount,
      income_date: new Date()
    });
    
    // บันทึกข้อมูล
    await newIncome.save();
    
    return NextResponse.json(newIncome);
  } catch (error) {
    console.error('Create Income Record Error:', error);
    return NextResponse.json(
      { error: 'Failed to create income record' },
      { status: 500 }
    );
  }
}

// GET - Get income records
export async function GET(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // รับค่า query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // สร้าง filter
    const filter: any = {};
    
    // ถ้ามีการกรองด้วย user ID
    if (userId) {
      // ถ้าเป็น driver สามารถดูได้เฉพาะรายได้ของตัวเอง
      if (session.user.role === 'driver' && session.user.id !== userId) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
      filter.user_id = userId;
    } else if (session.user.role === 'driver') {
      // ถ้าเป็น driver และไม่ได้ระบุ user_id ให้ดูเฉพาะของตัวเอง
      filter.user_id = session.user.id;
    }
    
    // ถ้ามีการกรองด้วยช่วงวันที่
    if (startDate && endDate) {
      filter.income_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.income_date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.income_date = { $lte: new Date(endDate) };
    }
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
    // นับจำนวนทั้งหมด
    const totalItems = await Income.countDocuments(filter);
    
    // ดึงข้อมูลตามเงื่อนไข
    const incomes = await Income.find(filter)
      .sort({ income_date: -1 }) // เรียงจากล่าสุด
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'name email employeeId')
      .populate('ticket_id', 'ticketNumber price soldAt');
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    // ส่งข้อมูลและข้อมูล pagination กลับ
    return NextResponse.json({
      incomes,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      }
    });
  } catch (error) {
    console.error('Get Income Records Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch income records' },
      { status: 500 }
    );
  }
}