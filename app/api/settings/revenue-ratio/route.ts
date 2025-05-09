// app/api/settings/revenue-ratio/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/authUtils';
import mongoose from 'mongoose';

// Define Schema for Revenue Ratio
const revenueRatioSchema = new mongoose.Schema({
  company: { 
    type: Number, 
    required: true, 
    min: 0,
    max: 100
  },
  station: { 
    type: Number, 
    required: true, 
    min: 0,
    max: 100
  },
  drivers: { 
    type: Number, 
    required: true, 
    min: 0,
    max: 100
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const RevenueRatio = mongoose.models.RevenueRatio || mongoose.model('RevenueRatio', revenueRatioSchema);

// GET - ดึงข้อมูลการตั้งค่าแบ่งรายได้
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

    // ตรวจสอบสิทธิ์ในการดูข้อมูลแบ่งรายได้
    if (!checkUserPermission(session, PERMISSIONS.VIEW_REVENUE_RATIO)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await connectDB();
    
    // ดึงข้อมูลการตั้งค่าล่าสุด
    let revenueRatio = await RevenueRatio.findOne().sort({ updatedAt: -1 });
    
    // ถ้าไม่มีข้อมูล ให้สร้างข้อมูลเริ่มต้น
    if (!revenueRatio) {
      revenueRatio = await RevenueRatio.create({
        company: 10,
        station: 20,
        drivers: 70
      });
    }
    
    return NextResponse.json(revenueRatio);
  } catch (error) {
    console.error('Get Revenue Ratio Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue ratio settings' },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตการตั้งค่าแบ่งรายได้
export async function PUT(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ในการแก้ไขข้อมูลแบ่งรายได้ (เฉพาะ admin เท่านั้น)
    if (!checkUserPermission(session, PERMISSIONS.MANAGE_REVENUE_RATIO)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    await connectDB();
    
    // รับข้อมูลจาก request
    const body = await request.json();
    const { company, station, drivers } = body;
    
    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (company === undefined || station === undefined || drivers === undefined) {
      return NextResponse.json(
        { error: 'All fields are required: company, station, drivers' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าผลรวมเท่ากับ 100% หรือไม่
    if (company + station + drivers !== 100) {
      return NextResponse.json(
        { error: 'Total percentage must be 100%' },
        { status: 400 }
      );
    }
    
    // สร้างข้อมูลใหม่
    const newRevenueRatio = await RevenueRatio.create({
      company,
      station,
      drivers,
      lastUpdatedBy: session.user.id
    });
    
    return NextResponse.json(newRevenueRatio);
  } catch (error) {
    console.error('Update Revenue Ratio Error:', error);
    return NextResponse.json(
      { error: 'Failed to update revenue ratio settings' },
      { status: 500 }
    );
  }
}