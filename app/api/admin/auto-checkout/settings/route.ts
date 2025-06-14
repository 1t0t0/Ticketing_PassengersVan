// app/api/admin/auto-checkout/settings/route.ts - แก้ไขให้ไม่ใช้ Models
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงการตั้งค่าปัจจุบัน (ใช้ default values)
export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can access auto checkout settings' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // ✅ ใช้ default settings แทนการอ่านจาก Database
    const settings = {
      enabled: process.env.AUTO_CHECKOUT_ENABLED === 'true' || false,
      checkoutTime: process.env.AUTO_CHECKOUT_TIME || '17:30',
      timezone: process.env.AUTO_CHECKOUT_TIMEZONE || 'Asia/Vientiane',
      lastRun: 'ไม่มีข้อมูล', // ไม่เก็บข้อมูลนี้แล้ว
      affectedUsers: 0 // ไม่เก็บข้อมูลนี้แล้ว
    };
    
    console.log('📖 Auto Checkout Settings loaded:', settings);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get Auto Checkout Settings Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto checkout settings' },
      { status: 500 }
    );
  }
}

// POST - บันทึกการตั้งค่าใหม่ (แค่ log แทนการบันทึกจริง)
export async function POST(request: Request) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can modify auto checkout settings' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // รับข้อมูลจาก request body
    const body = await request.json();
    const { enabled, checkoutTime, timezone } = body;
    
    // ตรวจสอบข้อมูล
    if (enabled && !checkoutTime) {
      return NextResponse.json(
        { error: 'Checkout time is required when auto checkout is enabled' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบรูปแบบเวลา
    if (checkoutTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(checkoutTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM format' },
        { status: 400 }
      );
    }
    
    // ✅ แค่ log การตั้งค่าแทนการบันทึกใน Database
    const settingsData = {
      enabled: Boolean(enabled),
      checkoutTime: checkoutTime || '17:30',
      timezone: timezone || process.env.APP_TIMEZONE || 'Asia/Vientiane',
      updatedBy: session.user.email || session.user.name,
      updatedAt: new Date().toISOString()
    };
    
    console.log('💾 Auto checkout settings updated (logged only):', settingsData);
    
    // ข้อความแจ้งให้ผู้ใช้ทราบ
    const message = enabled 
      ? `✅ เปิดใช้งาน Auto Checkout เวลา ${checkoutTime} (${timezone})`
      : '❌ ปิดใช้งาน Auto Checkout';
    
    console.log('📢 Settings change:', message);
    
    // ส่งกลับข้อมูลที่ "บันทึก"
    return NextResponse.json({
      ...settingsData,
      message: 'การตั้งค่าถูกบันทึกแล้ว (ดูใน Console Log)',
      note: 'Settings are logged to console instead of database'
    });
  } catch (error) {
    console.error('Save Auto Checkout Settings Error:', error);
    return NextResponse.json(
      { error: 'Failed to save auto checkout settings: ' + (error as Error).message },
      { status: 500 }
    );
  }
}