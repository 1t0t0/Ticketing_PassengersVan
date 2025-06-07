// app/api/driver/trip/route.ts - API สำหรับจัดการรอบการเดินทาง
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงสถานะรอบปัจจุบัน
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can access this endpoint' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const driverId = session.user.id;
    const status = await DriverTrip.getCurrentTripStatus(driverId);
    
    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get Trip Status Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get trip status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - เริ่มรอบใหม่
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can access this endpoint' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const driverId = session.user.id;
    const result = await DriverTrip.startNewTrip(driverId);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Start New Trip Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to start new trip'
      },
      { status: 500 }
    );
  }
}