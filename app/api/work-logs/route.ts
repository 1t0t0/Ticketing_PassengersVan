// app/api/work-logs/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkLog from '@/models/WorkLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - ดึงประวัติการเข้างาน
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let workLogs;
    
    if (userId && date) {
      // ดึงประวัติในวันที่กำหนด
      workLogs = await WorkLog.getUserWorkLogsForDate(userId, date);
    } else if (userId && startDate && endDate) {
      // ดึงประวัติในช่วงวันที่
      workLogs = await WorkLog.getUserWorkLogsForDateRange(userId, startDate, endDate);
    } else if (userId) {
      // ดึงประวัติล่าสุด
      workLogs = await WorkLog.getLatestWorkLogs(userId, limit);
    } else if (date) {
      // ดึงสถิติการเข้างานของทุกคนในวันที่กำหนด (เฉพาะ admin/staff)
      if (!['admin', 'staff'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
      workLogs = await WorkLog.getDailyAttendanceStats(date);
    } else {
      // ดึงประวัติของตัวเอง
      workLogs = await WorkLog.getLatestWorkLogs(session.user.id, limit);
    }
    
    return NextResponse.json(workLogs);
  } catch (error) {
    console.error('WorkLog GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
      { status: 500 }
    );
  }
}

// POST - บันทึกการเข้า/ออกงาน (ใช้เมื่อมีการ check-in/check-out)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { userId, action } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!userId || !action || !['check-in', 'check-out'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid userId or action' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบสิทธิ์
    if (session.user.role !== 'admin' && session.user.role !== 'staff' && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // บันทึก WorkLog
    const workLog = await WorkLog.logWorkAction(userId, action);
    
    return NextResponse.json(workLog);
  } catch (error) {
    console.error('WorkLog POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to log work action' },
      { status: 500 }
    );
  }
}