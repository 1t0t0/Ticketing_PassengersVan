// app/api/driver/trip/scan/route.ts - Enhanced with Assignment Check
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    
    console.log('🔍 Scan request received:', { ticketId, qrData });
    
    let ticketNumber = ticketId;
    let groupTicketData = null;
    
    // ✅ ปรับปรุงการตรวจสอบ QR Code Data รองรับ Group Ticket
    if (qrData) {
      try {
        console.log('📱 Processing QR Data:', qrData);
        
        const parsedQRData = JSON.parse(qrData);
        console.log('✅ Parsed QR Data:', parsedQRData);
        
        if (parsedQRData.ticketType === 'group' && parsedQRData.ticketNumber) {
          ticketNumber = parsedQRData.ticketNumber;
          groupTicketData = parsedQRData;
          console.log('🎫 Group Ticket QR detected:', {
            ticketNumber,
            passengerCount: parsedQRData.passengerCount,
            totalPrice: parsedQRData.totalPrice
          });
        } else if (parsedQRData.ticketNumber) {
          ticketNumber = parsedQRData.ticketNumber;
          console.log('🎫 Individual Ticket QR (JSON) detected:', ticketNumber);
        }
      } catch (parseError) {
        console.log('⚠️ QR data is not JSON, treating as plain string:', qrData);
        if (typeof qrData === 'string' && qrData.trim()) {
          ticketNumber = qrData.trim();
          console.log('📝 Using QR data as ticket number:', ticketNumber);
        }
      }
    }
    
    if (!ticketNumber || !ticketNumber.trim()) {
      console.error('❌ No ticket number provided');
      return NextResponse.json(
        { error: 'ກະລຸນາໃສ່ເລກທີ່ປີ້' },
        { status: 400 }
      );
    }

    const driverId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // ✅ 1. ตรวจสอบว่ามีรอบที่กำลังดำเนินการอยู่หรือไม่
    const activeTrip = await DriverTrip.findOne({
      driver_id: driverId,
      date: today,
      status: 'in_progress'
    });
    
    if (!activeTrip) {
      console.error('❌ No active trip found for driver:', driverId);
      return NextResponse.json(
        { error: 'ກະລຸນາເລີ່ມການເດີນທາງກ່ອນ' },
        { status: 400 }
      );
    }
    
    console.log('🚌 Active trip found:', {
      tripId: activeTrip._id,
      tripNumber: activeTrip.trip_number,
      currentPassengers: activeTrip.current_passengers,
      capacity: activeTrip.car_capacity
    });
    
    // ✅ 2. ค้นหา ticket โดยใช้ ticketNumber
    const ticket = await Ticket.findOne({ ticketNumber: ticketNumber.trim() });
    if (!ticket) {
      console.error('❌ Ticket not found:', ticketNumber);
      return NextResponse.json(
        { error: `ບໍ່ພົບຂໍ້ມູນປີ້ເລກທີ ${ticketNumber}` },
        { status: 404 }
      );
    }
    
    console.log('🎫 Ticket found:', {
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      passengerCount: ticket.passengerCount,
      price: ticket.price,
      assignedDriverId: ticket.assignedDriverId,
      isScanned: ticket.isScanned
    });
    
    // ✅ 3. NEW: ตรวจสอบ Assignment - ตั๋วนี้ถูก assign ให้คนขับคนนี้หรือไม่
    if (ticket.assignedDriverId) {
      const assignedDriverId = ticket.assignedDriverId.toString();
      const currentDriverId = driverId.toString();
      
      if (assignedDriverId !== currentDriverId) {
        console.error('❌ Ticket assigned to different driver:', {
          ticketNumber: ticket.ticketNumber,
          assignedTo: assignedDriverId,
          currentDriver: currentDriverId
        });
        
        // ดึงข้อมูลคนขับที่ถูก assign
        const assignedDriver = await require('@/models/User').default.findById(assignedDriverId)
          .select('name employeeId');
        
        return NextResponse.json(
          { 
            error: `❌ ປີ້ນີ້ຖືກມອບໝາຍໃຫ້ຄົນຂັບຄົນອື່ນ`,
            details: {
              message: assignedDriver 
                ? `ມອບໝາຍໃຫ້: ${assignedDriver.name} (${assignedDriver.employeeId})`
                : 'ມອບໝາຍໃຫ້ຄົນຂັບຄົນອື່ນ',
              assignedDriverInfo: assignedDriver || null,
              recommendation: 'ກະລຸນາຕິດຕໍ່ພະນັກງານຂາຍປີ້'
            }
          },
          { status: 403 } // Forbidden
        );
      } else {
        console.log('✅ Ticket assignment verified: assigned to current driver');
      }
    } else {
      // ตั๋วไม่ได้ถูก assign ให้ใคร - อนุญาตให้สแกนได้ (backward compatibility)
      console.log('⚠️ Ticket has no assignment - allowing scan for backward compatibility');
    }
    
    // ✅ 4. ตรวจสอบว่า ticket นี้ถูกสแกนไปแล้วในระบบหรือไม่
    const ticketUsedInSystem = await DriverTrip.findOne({
      'scanned_tickets.ticket_id': ticket._id
    });
    
    if (ticketUsedInSystem) {
      const usedByTrip = await DriverTrip.findOne({
        'scanned_tickets.ticket_id': ticket._id
      }).populate('driver_id', 'name employeeId');
      
      const scanDetails = usedByTrip?.scanned_tickets.find(
        (scan: any) => scan.ticket_id.toString() === ticket._id.toString()
      );
      
      const usedByDriverName = usedByTrip?.driver_id?.name || 'Unknown';
      const usedByEmployeeId = usedByTrip?.driver_id?.employeeId || 'Unknown';
      const scannedAt = scanDetails?.scanned_at ? new Date(scanDetails.scanned_at).toLocaleString('lo-LA') : 'Unknown';
      
      console.error('❌ Ticket already used:', {
        ticketNumber: ticket.ticketNumber,
        usedBy: usedByDriverName,
        usedAt: scannedAt
      });
      
      return NextResponse.json(
        { 
          error: `❌ ປີ້ເລກທີ ${ticketNumber} ຖືກສະແກນໄປແລ້ວ`,
          details: {
            message: `ຖືກສະແກນໂດຍ: ${usedByDriverName} (${usedByEmployeeId})`,
            scannedAt: `ເວລາ: ${scannedAt}`,
            tripId: usedByTrip?._id,
            usedByDriver: {
              name: usedByDriverName,
              employeeId: usedByEmployeeId
            }
          }
        },
        { status: 400 }
      );
    }
    
    // ✅ 5. ตรวจสอบความจุรถรองรับ Group Ticket
    const passengersToAdd = ticket.ticketType === 'group' ? ticket.passengerCount : 1;
    const newTotalPassengers = activeTrip.current_passengers + passengersToAdd;
    
    console.log('👥 Passenger calculation:', {
      ticketType: ticket.ticketType,
      passengersToAdd,
      currentPassengers: activeTrip.current_passengers,
      newTotal: newTotalPassengers,
      carCapacity: activeTrip.car_capacity
    });
    
    if (newTotalPassengers > activeTrip.car_capacity) {
      console.error('❌ Car capacity exceeded:', {
        newTotal: newTotalPassengers,
        capacity: activeTrip.car_capacity
      });
      return NextResponse.json(
        { error: `ລົດຈະເຕັມ! ປັດຈຸບັນ ${activeTrip.current_passengers} ຄົນ + ${passengersToAdd} ຄົນ = ${newTotalPassengers} ຄົນ (ຄວາມຈຸ: ${activeTrip.car_capacity} ຄົນ)` },
        { status: 400 }
      );
    }
    
    // ✅ 6. เพิ่มผู้โดยสาร (รองรับ Group Ticket)
    const passengerOrder = activeTrip.current_passengers + 1;
    
    activeTrip.scanned_tickets.push({
      ticket_id: ticket._id,
      scanned_at: new Date(),
      passenger_order: passengerOrder
    });
    
    activeTrip.current_passengers = newTotalPassengers;
    
    // อัพเดท is_80_percent_reached
    const is80PercentReached = activeTrip.current_passengers >= activeTrip.required_passengers;
    activeTrip.is_80_percent_reached = is80PercentReached;
    
    await activeTrip.save();
    
    // ✅ 7. NEW: อัปเดตสถานะ Ticket เป็น "scanned"
    try {
      ticket.isScanned = true;
      ticket.scannedAt = new Date();
      ticket.scannedBy = driverId;
      ticket.tripId = activeTrip._id;
      await ticket.save();
      
      console.log('✅ Ticket marked as scanned:', {
        ticketNumber: ticket.ticketNumber,
        scannedBy: driverId,
        tripId: activeTrip._id
      });
    } catch (ticketUpdateError) {
      console.error('⚠️ Failed to update ticket scan status:', ticketUpdateError);
      // ไม่ให้ error นี้หยุดการทำงาน - trip ยังดำเนินการต่อได้
    }
    
    console.log('✅ Trip updated successfully:', {
      tripNumber: activeTrip.trip_number,
      currentPassengers: activeTrip.current_passengers,
      required: activeTrip.required_passengers,
      is80PercentReached
    });
    
    // ✅ 8. สร้างข้อความแจ้งเตือนรองรับ Group Ticket และ Assignment
    let message = '';
    let statusMessage = '';
    
    if (ticket.ticketType === 'group') {
      message = `✅ ສະແກນປີ້ກະລຸ່ມສຳເລັດ: +${passengersToAdd} ຄົນ (ລວມ ${activeTrip.current_passengers}/${activeTrip.car_capacity} ຄົນ)`;
    } else {
      message = `✅ ສະແກນສຳເລັດ: ${activeTrip.current_passengers}/${activeTrip.car_capacity} ຄົນ`;
    }
    
    // เพิ่มข้อความเกี่ยวกับ assignment
    if (ticket.assignedDriverId && ticket.assignedDriverId.toString() === driverId.toString()) {
      message += ' 🎯 (ປີ້ທີ່ໄດ້ຮັບມອບໝາຍ)';
    }
    
    if (is80PercentReached && activeTrip.current_passengers < activeTrip.car_capacity) {
      statusMessage = `🎯 ຄົບເປົ້າໝາຍ ${activeTrip.required_passengers} ຄົນແລ້ວ! ສາມາດສືບຕໍ່ສະແກນຫຼືປິດຮອບໄດ້`;
    } else if (activeTrip.current_passengers === activeTrip.car_capacity) {
      statusMessage = `🚌 ລົດເຕັມແລ້ວ! ກະລຸນາປິດຮອບ`;
    } else {
      const remaining = activeTrip.required_passengers - activeTrip.current_passengers;
      if (remaining > 0) {
        statusMessage = `ຕ້ອງການອີກ ${remaining} ຄົນເພື່ອຄົບເປົ້າໝາຍ`;
      }
    }
    
    // ✅ 9. Response รองรับ Group Ticket และ Assignment Info
    const responseData = {
      success: true,
      trip_number: activeTrip.trip_number,
      current_passengers: activeTrip.current_passengers,
      required_passengers: activeTrip.required_passengers,
      car_capacity: activeTrip.car_capacity,
      occupancy_percentage: Math.round((activeTrip.current_passengers / activeTrip.car_capacity) * 100),
      progress_percentage: Math.round((activeTrip.current_passengers / activeTrip.required_passengers) * 100),
      is_80_percent_reached: is80PercentReached,
      can_complete_trip: true,
      trip_completed: false,
      message: message,
      status_message: statusMessage,
      
      // ✅ ข้อมูล ticket ที่สแกน
      ticket_info: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticketNumber,
        ticket_type: ticket.ticketType,
        passenger_count: ticket.passengerCount,
        price: ticket.price,
        price_per_person: ticket.pricePerPerson,
        passenger_order: passengerOrder,
        passengers_added: passengersToAdd,
        was_assigned: !!ticket.assignedDriverId,
        assignment_verified: ticket.assignedDriverId?.toString() === driverId.toString()
      },
      
      // ✅ ข้อมูลเพิ่มเติมสำหรับ Group Ticket
      group_ticket_info: ticket.ticketType === 'group' ? {
        is_group_ticket: true,
        total_passengers_in_group: ticket.passengerCount,
        price_breakdown: {
          price_per_person: ticket.pricePerPerson,
          total_group_price: ticket.price,
          calculation: `₭${ticket.pricePerPerson.toLocaleString()} × ${ticket.passengerCount} = ₭${ticket.price.toLocaleString()}`
        }
      } : {
        is_group_ticket: false
      },
      
      // ✅ NEW: Assignment Info
      assignment_info: {
        was_assigned: !!ticket.assignedDriverId,
        assigned_to_current_driver: ticket.assignedDriverId?.toString() === driverId.toString(),
        verification_status: ticket.assignedDriverId 
          ? (ticket.assignedDriverId.toString() === driverId.toString() ? 'verified' : 'wrong_driver')
          : 'no_assignment'
      }
    };
    
    console.log('📤 Sending response:', responseData);
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('💥 Scan QR Code Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to scan QR code';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorStack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}