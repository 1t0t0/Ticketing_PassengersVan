// app/api/driver/trip/scan/route.ts - แก้ไข ObjectId casting error
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - สแกน QR Code หรือเลขตั๋ว
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
    
    console.log('Scan request:', { ticketId, qrData });
    
    let ticketNumber = ticketId;
    
    // ตรวจสอบข้อมูล QR Code (ถ้ามี)
    if (qrData) {
      try {
        const parsedQRData = JSON.parse(qrData);
        if (parsedQRData.forDriverOnly && parsedQRData.ticketNumber) {
          ticketNumber = parsedQRData.ticketNumber;
          console.log('Using ticket number from QR:', ticketNumber);
        }
      } catch (error) {
        console.warn('Failed to parse QR data, using ticketId as fallback');
      }
    }
    
    if (!ticketNumber || !ticketNumber.trim()) {
      return NextResponse.json(
        { error: 'ກະລຸນາໃສ່ຂໍ້ມູນຕັ້ວ' },
        { status: 400 }
      );
    }
    
    const driverId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // ตรวจสอบว่ามีรอบที่กำลังดำเนินการอยู่หรือไม่
    const activeTrip = await DriverTrip.findOne({
      driver_id: driverId,
      date: today,
      status: 'in_progress'
    });
    
    if (!activeTrip) {
      return NextResponse.json(
        { error: 'ກະລຸນາເລີ່ມການເດີນທາງກ່ອນ' },
        { status: 400 }
      );
    }
    
    console.log('Active trip found:', activeTrip._id);
    
    // ค้นหา ticket โดยใช้ ticketNumber แทน _id
    const ticket = await Ticket.findOne({ ticketNumber: ticketNumber.trim() });
    if (!ticket) {
      return NextResponse.json(
        { error: `ບໍ່ພົບຂໍ້ມູນຕັ້ວເລກທີ ${ticketNumber}` },
        { status: 404 }
      );
    }
    
    console.log('Ticket found:', ticket._id, ticket.ticketNumber);
    
    // ตรวจสอบว่า ticket นี้ถูกสแกนแล้วหรือไม่ (ใช้ ticket._id)
    const ticketAlreadyScanned = await DriverTrip.findOne({
      'scanned_tickets.ticket_id': ticket._id
    });
    
    if (ticketAlreadyScanned) {
      return NextResponse.json(
        { error: `ຕັ້ວເລກທີ ${ticketNumber} ຖືກສະແກນແລ້ວ` },
        { status: 400 }
      );
    }
    
    // เพิ่มผู้โดยสาร
    const passengerOrder = activeTrip.current_passengers + 1;
    
    activeTrip.scanned_tickets.push({
      ticket_id: ticket._id, // ใช้ ObjectId ของ ticket
      scanned_at: new Date(),
      passenger_order: passengerOrder
    });
    
    activeTrip.current_passengers = passengerOrder;
    
    // ตรวจสอบว่าครบ 80% หรือไม่
    const is80PercentReached = activeTrip.current_passengers >= activeTrip.required_passengers;
    activeTrip.is_80_percent_reached = is80PercentReached;
    
    // ถ้าครบ 80% ให้เปลี่ยนสถานะเป็น completed
    if (is80PercentReached) {
      activeTrip.status = 'completed';
      activeTrip.completed_at = new Date();
    }
    
    await activeTrip.save();
    
    console.log('Trip updated successfully:', {
      tripId: activeTrip._id,
      currentPassengers: activeTrip.current_passengers,
      requiredPassengers: activeTrip.required_passengers,
      completed: is80PercentReached
    });
    
    return NextResponse.json({
      success: true,
      trip_number: activeTrip.trip_number,
      current_passengers: activeTrip.current_passengers,
      required_passengers: activeTrip.required_passengers,
      car_capacity: activeTrip.car_capacity,
      occupancy_percentage: Math.round((activeTrip.current_passengers / activeTrip.car_capacity) * 100),
      is_80_percent_reached: is80PercentReached,
      trip_completed: is80PercentReached,
      message: is80PercentReached ? 
        `🎉 ສຳເລັດຮອບທີ ${activeTrip.trip_number}! ໄດ້ຮັບຜູ້ໂດຍສານ ${activeTrip.current_passengers} ຄົນ` :
        `ເພີ່ມຜູ້ໂດຍສານ: ${activeTrip.current_passengers}/${activeTrip.required_passengers} ຄົນ`,
      ticket_info: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticketNumber,
        price: ticket.price,
        passenger_order: passengerOrder
      }
    });

  } catch (error) {
    console.error('Scan QR Code Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to scan QR code',
        details: error instanceof Error ? error.stack : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}