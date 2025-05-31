// app/api/work-logs/user/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkLog from '@/models/WorkLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - ดึงประวัติการเข้างานของผู้ใช้คนหนึ่ง
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const limit = parseInt(searchParams.get('limit') || '100');
    const type = searchParams.get('type') || 'recent'; // 'recent', 'monthly', 'daily'
    
    // ตรวจสอบสิทธิ์
    if (session.user.role !== 'admin' && session.user.role !== 'staff' && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    let result;
    
    switch (type) {
      case 'monthly':
        // ดึงสถิติรายเดือน
        result = await WorkLog.getUserMonthlyStats(userId, year, month);
        break;
        
      case 'daily':
        // ดึงประวัติรายวัน
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        result = await WorkLog.getUserWorkLogsForDate(userId, date);
        break;
        
      default:
        // ดึงประวัติล่าสุด
        result = await WorkLog.getLatestWorkLogs(userId, limit);
        break;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('User WorkLog GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user work logs' },
      { status: 500 }
    );
  }
}

// POST - บันทึกการเข้า/ออกงานสำหรับผู้ใช้คนหนึ่ง
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const userId = params.id;
    const body = await request.json();
    const { action } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!action || !['check-in', 'check-out'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
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
    
    return NextResponse.json({
      success: true,
      workLog: workLog,
      message: `บันทึก${action === 'check-in' ? 'เข้างาน' : 'ออกงาน'}สำเร็จ`
    });
  } catch (error) {
    console.error('User WorkLog POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to log work action' },
      { status: 500 }
    );
  }
}