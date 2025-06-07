// app/api/driver/trip/scan/route.ts - API สำหรับสแกน QR Code
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - สแกน QR Code
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
    
    const body = await request.json();
    const { ticketId, qrData } = body;
    
    // ตรวจสอบข้อมูล QR Code (optional - สำหรับความปลอดภัย)
    if (qrData) {
      try {
        const parsedQRData = JSON.parse(qrData);
        if (!parsedQRData.forDriverOnly) {
          return NextResponse.json(
            { error: 'QR Code นี้ไม่ใช่สำหรับ Driver' },
            { status: 400 }
          );
        }
        // ใช้ ticketId จาก QR Data แทน
        const qrTicketId = parsedQRData.ticketNumber; // หรือ parsedQRData.ticketId
      } catch (error) {
        return NextResponse.json(
          { error: 'QR Code ไม่ถูกต้อง' },
          { status: 400 }
        );
      }
    }
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'ກະລຸນາໃສ່ຂໍ້ມູນຕັ້ວ' },
        { status: 400 }
      );
    }
    
    const driverId = session.user.id;
    const result = await DriverTrip.scanQRCode(driverId, ticketId);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Scan QR Code Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to scan QR code'
      },
      { status: 500 }
    );
  }
}