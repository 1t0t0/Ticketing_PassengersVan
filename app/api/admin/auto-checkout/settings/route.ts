// app/api/admin/auto-checkout/settings/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Collection สำหรับเก็บการตั้งค่า Auto Checkout
let AutoCheckoutSettings: any;

const getAutoCheckoutModel = async () => {
  if (AutoCheckoutSettings) return AutoCheckoutSettings;
  
  const mongoose = require('mongoose');
  
  const autoCheckoutSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    checkoutTime: { type: String, default: '17:30' },
    timezone: { type: String, default: 'Asia/Vientiane' },
    lastRun: { type: Date },
    affectedUsers: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }, { timestamps: true });
  
  AutoCheckoutSettings = mongoose.models.AutoCheckoutSettings || 
                        mongoose.model('AutoCheckoutSettings', autoCheckoutSchema);
  
  return AutoCheckoutSettings;
};

// GET - ดึงการตั้งค่าปัจจุบัน
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
    const AutoCheckoutSettings = await getAutoCheckoutModel();
    
    // ดึงการตั้งค่าล่าสุด หรือสร้างค่าเริ่มต้นถ้าไม่มี
    let settings = await AutoCheckoutSettings.findOne().sort({ createdAt: -1 });
    
    if (!settings) {
      settings = {
        enabled: false,
        checkoutTime: '17:30',
        timezone: 'Asia/Vientiane',
        lastRun: null,
        affectedUsers: 0
      };
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get Auto Checkout Settings Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto checkout settings' },
      { status: 500 }
    );
  }
}

// POST - บันทึกการตั้งค่าใหม่
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
    const AutoCheckoutSettings = await getAutoCheckoutModel();
    
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
    
    // สร้างหรือแก้ไขการตั้งค่า
    const settingsData = {
      enabled: Boolean(enabled),
      checkoutTime: checkoutTime || '17:30',
timezone: timezone || process.env.APP_TIMEZONE || 'Asia/Vientiane',
      updatedBy: session.user.id
    };
    
    // ลองหาการตั้งค่าเดิม
    const existingSettings = await AutoCheckoutSettings.findOne().sort({ createdAt: -1 });
    
    let savedSettings;
    if (existingSettings) {
      // อัพเดทการตั้งค่าเดิม
      savedSettings = await AutoCheckoutSettings.findByIdAndUpdate(
        existingSettings._id,
        { $set: settingsData },
        { new: true }
      );
    } else {
      // สร้างการตั้งค่าใหม่
      savedSettings = await AutoCheckoutSettings.create({
        ...settingsData,
        createdBy: session.user.id
      });
    }
    
    console.log('Auto checkout settings saved:', savedSettings);
    
    // อัพเดท schedule ใหม่
    try {
      const { updateAutoCheckoutSchedule } = await import('@/lib/autoCheckoutScheduler');
      await updateAutoCheckoutSchedule();
      console.log('Auto checkout schedule updated successfully');
    } catch (scheduleError) {
      console.error('Failed to update auto checkout schedule:', scheduleError);
      // ไม่ให้ล้มเหลวทั้งหมดถ้าอัพเดท schedule ไม่สำเร็จ
    }
    
    return NextResponse.json(savedSettings);
  } catch (error) {
    console.error('Save Auto Checkout Settings Error:', error);
    return NextResponse.json(
      { error: 'Failed to save auto checkout settings: ' + (error as Error).message },
      { status: 500 }
    );
  }
}