// app/api/cars/usage/route.ts - FIXED ให้คำนวณการใช้งานจาก assigned tickets ที่ยังไม่ได้สแกน
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Car from '@/models/Car';
import DriverTrip from '@/models/DriverTrip';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - ดูการใช้งานรถปัจจุบัน (Real-time) - FIXED
export async function GET(request: Request) {
  try {
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

    console.log(`🚗 Checking real-time usage for car: ${carRegistration} on date: ${date}`);
    
    // หาข้อมูลรถ
    const car = await Car.findOne({ car_registration: carRegistration })
      .populate('user_id', 'name employeeId checkInStatus');
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    console.log(`🚗 Found car: ${car.car_registration}, Driver: ${car.user_id?.name}, Capacity: ${car.car_capacity}`);

    // ✅ FIXED: คำนวณการใช้งานจาก 2 แหล่ง
    let currentUsage = 0;
    
    // 1. ตรวจสอบจาก active trip (ผู้โดยสารที่สแกนแล้วในรอบปัจจุบัน)
    const activeTrip = await DriverTrip.findOne({
      driver_id: car.user_id._id,
      date: date,
      status: 'in_progress'
    });
    
    let tripUsage = 0;
    if (activeTrip) {
      tripUsage = activeTrip.current_passengers || 0;
      console.log(`📊 Active trip ${activeTrip.trip_number} usage: ${tripUsage} passengers`);
    }
    
    // 2. ✅ CRITICAL FIX: ตรวจสอบจาก assigned tickets ที่ยังไม่ได้สแกน
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    const assignedTickets = await Ticket.find({
      assignedDriverId: car.user_id._id,
      soldAt: { $gte: startOfDay, $lte: endOfDay },
      isScanned: false // ✅ CRITICAL: เฉพาะตั๋วที่ยังไม่ได้สแกน
    }).select('ticketNumber passengerCount price ticketType soldAt isScanned assignedAt');
    
    console.log(`🎫 Found ${assignedTickets.length} assigned unscanned tickets for ${car.user_id?.name}`);
    
    // คำนวณจำนวนผู้โดยสารจาก assigned tickets ที่ยังไม่ได้สแกน
    let assignedPassengers = 0;
    assignedTickets.forEach(ticket => {
      const passengerCount = ticket.passengerCount || 1;
      assignedPassengers += passengerCount;
      console.log(`🎫 Ticket ${ticket.ticketNumber} (${ticket.ticketType}): ${passengerCount} passengers`);
    });
    
    console.log(`📊 Assigned passengers from unscanned tickets: ${assignedPassengers}`);
    
    // ✅ FIXED: รวมการใช้งานจาก 2 แหล่ง
    // currentUsage = ผู้โดยสารที่สแกนแล้วในรอบปัจจุบัน + ผู้โดยสารจากตั๋วที่ assigned แล้วแต่ยังไม่ได้สแกน
    currentUsage = tripUsage + assignedPassengers;
    
    console.log(`📊 Total current usage calculation:
      - Trip usage (scanned): ${tripUsage}
      - Assigned pending: ${assignedPassengers}
      - Total current usage: ${currentUsage}
      - Car capacity: ${car.car_capacity}
    `);
    
    // คำนวณที่นั่งที่เหลือ
    const availableSeats = Math.max(0, car.car_capacity - currentUsage);
    const usagePercentage = car.car_capacity > 0 ? Math.round((currentUsage / car.car_capacity) * 100) : 0;
    
    // ✅ หาตั๋วที่ assigned ให้รถคันนี้ในวันนี้ทั้งหมด (สำหรับ reference)
    const allAssignedTickets = await Ticket.find({
      assignedDriverId: car.user_id._id,
      soldAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('ticketNumber passengerCount price ticketType soldAt isScanned assignedAt');
    
    // แยกตั๋วที่สแกนแล้วและยังไม่สแกน
    const scannedTickets = allAssignedTickets.filter(ticket => ticket.isScanned);
    const pendingTickets = allAssignedTickets.filter(ticket => !ticket.isScanned);
    
    const scannedPassengers = scannedTickets.reduce((total, ticket) => {
      return total + (ticket.passengerCount || 1);
    }, 0);
    
    const pendingPassengers = pendingTickets.reduce((total, ticket) => {
      return total + (ticket.passengerCount || 1);
    }, 0);
    
    const totalRevenue = allAssignedTickets.reduce((total, ticket) => {
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
        currentUsage: currentUsage, // ✅ FIXED: รวมทั้ง scanned + assigned pending
        availableSeats: availableSeats,
        usagePercentage: usagePercentage,
        totalTickets: allAssignedTickets.length,
        scannedPassengers: scannedPassengers,
        pendingPassengers: pendingPassengers, // ✅ ผู้โดยสารจากตั๋วที่ assigned แต่ยังไม่สแกน
        totalRevenue: totalRevenue,
        activeTrip: activeTrip ? {
          trip_id: activeTrip._id,
          trip_number: activeTrip.trip_number,
          status: activeTrip.status,
          passengers_in_trip: activeTrip.current_passengers
        } : null,
        // ✅ เพิ่มข้อมูลการคำนวณใหม่
        calculation: {
          tripScannedPassengers: tripUsage,
          assignedPendingPassengers: assignedPassengers,
          totalCurrentUsage: currentUsage,
          method: 'scanned_plus_assigned_pending'
        }
      },
      tickets: {
        all: allAssignedTickets.length,
        scanned: scannedTickets.length,
        pending: pendingTickets.length,
        details: allAssignedTickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          ticketType: ticket.ticketType,
          passengerCount: ticket.passengerCount,
          price: ticket.price,
          soldAt: ticket.soldAt,
          isScanned: ticket.isScanned,
          assignedAt: ticket.assignedAt
        }))
      }
    };
    
    console.log(`✅ Real-time usage calculation completed for ${carRegistration}:`, {
      currentUsage,
      availableSeats,
      usagePercentage,
      hasActiveTrip: !!activeTrip,
      assignedTickets: assignedTickets.length,
      pendingPassengers: assignedPassengers,
      calculation: result.usage.calculation
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
    const Car = mongoose.models.Car || (await import('@/models/Car')).default;
    const carInfo = await Car.findOne({ 
      car_registration: carRegistration 
    }).populate('user_id', 'name employeeId');
    
    if (!carInfo) {
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
          assignedDriverId: carInfo.user_id._id,
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