// app/api/driver/revenue/route.ts - API สำหรับดูรายได้ (อัปเดตเดิม)
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงข้อมูลรายได้ (รวมเงื่อนไข 2 รอบ)
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
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const driverId = session.user.id;
    
    // ดึงสถานะรอบการเดินทาง
    const tripStatus = await DriverTrip.getCurrentTripStatus(driverId);
    
    // คำนวณรายได้
    const revenueData = await DriverTrip.calculateDriverRevenue(date);
    
    // ตรวจสอบว่า driver คนนี้มีสิทธิ์ได้รับส่วนแบ่งหรือไม่
    const myRevenue = revenueData.drivers.find(
      driver => driver.driver_id.toString() === driverId
    );
    
    return NextResponse.json({
      success: true,
      date: date,
      trip_status: tripStatus,
      revenue_data: {
        total_revenue: revenueData.total_revenue,
        driver_share_total: revenueData.driver_share_total,
        qualified_drivers: revenueData.qualified_drivers,
        my_qualification: {
          completed_trips: tripStatus.completed_trips_today,
          qualifies: tripStatus.qualifies_for_revenue,
          revenue_share: myRevenue?.revenue_share || 0,
          status_message: tripStatus.revenue_status
        }
      }
    });

  } catch (error) {
    console.error('Get Driver Revenue Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get driver revenue data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}