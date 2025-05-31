// app/api/driver-revenue/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงรายได้ของคนขับ
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const date = searchParams.get('date');
    const type = searchParams.get('type') || 'daily'; // daily, monthly, summary
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    console.log('Driver revenue request:', { driverId, date, type, year, month });

    // ถ้าไม่ระบุ driverId และไม่ใช่ admin ให้ใช้ ID ของตัวเอง
    let targetDriverId = driverId;
    if (!driverId && session.user.role === 'driver') {
      targetDriverId = session.user.id;
    }

    // ตรวจสอบสิทธิ์
    if (session.user.role !== 'admin' && session.user.role !== 'staff') {
      if (session.user.role !== 'driver' || targetDriverId !== session.user.id) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    let result;

    switch (type) {
      case 'daily':
        if (!date) {
          return NextResponse.json({ error: 'Date is required for daily report' }, { status: 400 });
        }
        
        if (targetDriverId) {
          // รายได้รายวันของคนขับคนหนึ่ง
          result = await Income.getDriverDailyIncome(targetDriverId, date);
          
          // เพิ่มข้อมูลคนขับ
          const driver = await User.findById(targetDriverId).select('name employeeId checkInStatus');
          result.driver = driver;
        } else {
          // รายได้รายวันของคนขับทุกคน (เฉพาะ admin/staff)
          if (!['admin', 'staff'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
          }
          result = await Income.getAllDriversDailyIncome(date);
        }
        break;

      case 'monthly':
        if (!targetDriverId || !year || !month) {
          return NextResponse.json({ 
            error: 'Driver ID, year, and month are required for monthly report' 
          }, { status: 400 });
        }
        
        result = await Income.getDriverMonthlyIncome(
          targetDriverId, 
          parseInt(year), 
          parseInt(month)
        );
        
        // เพิ่มข้อมูลคนขับ
        const driver = await User.findById(targetDriverId).select('name employeeId');
        result.driver = driver;
        break;

      case 'summary':
        if (!date) {
          return NextResponse.json({ error: 'Date is required for summary' }, { status: 400 });
        }
        
        // สรุปรายได้รายวันแบบรวม
        result = await Income.getDailyRevenueSummary(date);
        break;

      case 'undistributed':
        // รายได้ที่ยังไม่ได้แบ่งจ่าย
        if (!['admin', 'staff'].includes(session.user.role)) {
          return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }
        
        result = await Income.getUndistributedIncome(targetDriverId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      type,
      date,
      driverId: targetDriverId,
      data: result
    });

  } catch (error) {
    console.error('Driver revenue API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch driver revenue data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - อัพเดทสถานะการแบ่งรายได้
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const { action, incomeIds, driverId, date } = body;
    
    console.log('Driver revenue POST request:', { action, incomeIds, driverId, date });

    switch (action) {
      case 'mark_distributed':
        if (!incomeIds || !Array.isArray(incomeIds)) {
          return NextResponse.json({ error: 'Income IDs array is required' }, { status: 400 });
        }
        
        const updateResult = await Income.markAsDistributed(incomeIds);
        
        return NextResponse.json({
          success: true,
          message: `Marked ${updateResult.modifiedCount} income records as distributed`,
          modifiedCount: updateResult.modifiedCount
        });

      case 'calculate_driver_share':
        // คำนวณส่วนแบ่งใหม่สำหรับวันที่กำหนด
        if (!date) {
          return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }
        
        // ดึงรายได้ที่ยังไม่ได้แบ่งในวันนั้น
        const undistributedIncomes = await Income.find({
          revenue_share_type: 'driver',
          is_distributed: false,
          income_date: {
            $gte: new Date(date + 'T00:00:00.000Z'),
            $lte: new Date(date + 'T23:59:59.999Z')
          }
        });
        
        return NextResponse.json({
          success: true,
          date,
          undistributedCount: undistributedIncomes.length,
          totalAmount: undistributedIncomes.reduce((sum, income) => sum + income.income_amount, 0),
          incomes: undistributedIncomes
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Driver revenue POST error:', error);
    return NextResponse.json({
      error: 'Failed to process driver revenue request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}