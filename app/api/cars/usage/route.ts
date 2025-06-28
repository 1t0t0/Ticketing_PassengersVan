// app/api/cars/usage/route.ts - API สำหรับดูการใช้งานรถแบบ Real-time
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Car from '@/models/Car';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - ดูการใช้งานรถปัจจุบัน
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

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const carRegistration = searchParams.get('carRegistration');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    if (!carRegistration) {
      return NextResponse.json(
        { error: 'Car registration is required' },
        { status: 400 }
      );
    }

    console.log(`🚗 Checking usage for car: ${carRegistration} on date: ${date}`);
    
    // หาข้อมูลรถ
    const car = await Car.findOne({ car_registration: carRegistration })
      .populate('user_id', 'name employeeId checkInStatus');
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // หาตั๋วที่จองรถคันนี้แล้วในวันที่กำหนด
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const assignedTickets = await Ticket.find({
      assignedDriverId: car.user_id._id,
      soldAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('ticketNumber passengerCount price ticketType soldAt isScanned');
    
    console.log(`📊 Found ${assignedTickets.length} tickets assigned to car ${carRegistration}`);
    
    // คำนวณการใช้งาน
    const currentUsage = assignedTickets.reduce((total, ticket) => {
      return total + (ticket.passengerCount || 1);
    }, 0);
    
    const availableSeats = Math.max(0, car.car_capacity - currentUsage);
    const usagePercentage = car.car_capacity > 0 ? Math.round((currentUsage / car.car_capacity) * 100) : 0;
    
    // แยกตั๋วที่สแกนแล้วและยังไม่สแกน
    const scannedTickets = assignedTickets.filter(ticket => ticket.isScanned);
    const pendingTickets = assignedTickets.filter(ticket => !ticket.isScanned);
    
    const scannedPassengers = scannedTickets.reduce((total, ticket) => {
      return total + (ticket.passengerCount || 1);
    }, 0);
    
    const pendingPassengers = pendingTickets.reduce((total, ticket) => {
      return total + (ticket.passengerCount || 1);
    }, 0);
    
    const totalRevenue = assignedTickets.reduce((total, ticket) => {
      return total + ticket.price;
    }, 0);

    const result = {
      success: true,
      car: {
        _id: car._id,
        car_registration: car.car_registration,
        car_name: car.car_name,
        car_capacity: car.car_capacity,
        driver: car.user_id ? {
          _id: car.user_id._id,
          name: car.user_id.name,
          employeeId: car.user_id.employeeId,
          checkInStatus: car.user_id.checkInStatus
        } : null
      },
      usage: {
        date: date,
        currentUsage: currentUsage,
        availableSeats: availableSeats,
        usagePercentage: usagePercentage,
        totalTickets: assignedTickets.length,
        scannedPassengers: scannedPassengers,
        pendingPassengers: pendingPassengers,
        totalRevenue: totalRevenue
      },
      tickets: {
        all: assignedTickets.length,
        scanned: scannedTickets.length,
        pending: pendingTickets.length,
        details: assignedTickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          ticketType: ticket.ticketType,
          passengerCount: ticket.passengerCount,
          price: ticket.price,
          soldAt: ticket.soldAt,
          isScanned: ticket.isScanned
        }))
      }
    };
    
    console.log(`✅ Usage calculation for ${carRegistration}:`, {
      currentUsage,
      availableSeats,
      usagePercentage,
      totalTickets: assignedTickets.length
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Get Car Usage Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car usage: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - รีเซ็ตการใช้งานรถ (สำหรับ admin เท่านั้น)
export async function POST(request: Request) {
  try {
    // Check authorization (admin only)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { carRegistration, date, action } = body;
    
    if (!carRegistration || !action) {
      return NextResponse.json(
        { error: 'Car registration and action are required' },
        { status: 400 }
      );
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // หาข้อมูลรถ
    const car = await Car.findOne({ car_registration: carRegistration })
      .populate('user_id', 'name employeeId');
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    if (action === 'reset_assignments') {
      // ยกเลิกการ assign ตั๋วทั้งหมดของรถคันนี้ในวันที่กำหนด
      const startOfDay = new Date(targetDate + 'T00:00:00.000Z');
      const endOfDay = new Date(targetDate + 'T23:59:59.999Z');
      
      const result = await Ticket.updateMany(
        {
          assignedDriverId: car.user_id._id,
          soldAt: { $gte: startOfDay, $lte: endOfDay },
          isScanned: false // เฉพาะตั๋วที่ยังไม่ได้สแกน
        },
        {
          $unset: {
            assignedDriverId: 1,
            assignedAt: 1
          },
          $set: {
            isAssigned: false
          }
        }
      );
      
      return NextResponse.json({
        success: true,
        message: `Reset ${result.modifiedCount} ticket assignments for car ${carRegistration}`,
        resetCount: result.modifiedCount,
        date: targetDate
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Car Usage Reset Error:', error);
    return NextResponse.json(
      { error: 'Failed to process car usage action: ' + (error as Error).message },
      { status: 500 }
    );
  }
}