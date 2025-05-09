// app/api/incomes/summary/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const period = searchParams.get('period') || 'daily'; // daily, monthly
    const dateStr = searchParams.get('date');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    // ตรวจสอบสิทธิ์ในการดูข้อมูล
    if (userId && session.user.role === 'driver' && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // ถ้าเป็น driver และไม่ได้ระบุ user_id ให้ดูเฉพาะของตัวเอง
    const targetUserId = userId || (session.user.role === 'driver' ? session.user.id : null);
    
    let result;
    
    if (period === 'daily' && dateStr) {
      // สรุปรายได้รายวัน
      const date = new Date(dateStr);
      
      if (targetUserId) {
        // สรุปรายได้รายวันของคนขับคนเดียว
        result = await Income.getDailyIncome(targetUserId, date);
      } else {
        return NextResponse.json(
          { error: 'User ID is required for daily summary' },
          { status: 400 }
        );
      }
    } else if (period === 'monthly' && year && month) {
      // สรุปรายได้รายเดือน
      if (targetUserId) {
        // สรุปรายได้รายเดือนของคนขับคนเดียว
        result = await Income.getMonthlyIncome(targetUserId, parseInt(year), parseInt(month));
      } else {
        return NextResponse.json(
          { error: 'User ID is required for monthly summary' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ summary: result });
  } catch (error) {
    console.error('Income Summary Error:', error);
    return NextResponse.json(
      { error: 'Failed to get income summary' },
      { status: 500 }
    );
  }
}