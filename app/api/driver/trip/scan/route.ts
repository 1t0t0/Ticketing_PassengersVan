// app/api/driver/trip/scan/route.ts - Enhanced with Booking Integration
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can scan tickets' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { ticketId } = body;
    
    if (!ticketId || !ticketId.trim()) {
      return NextResponse.json(
        { error: 'ກະລຸນາໃສ່ເລກທີ່ຂອງປີ້' },
        { status: 400 }
      );
    }

    console.log('🎫 Driver scan request:', {
      driverId: session.user.id,
      ticketId: ticketId.trim(),
      driverEmail: session.user.email
    });

    // Get driver information
    const driver = await User.findById(session.user.id);
    if (!driver) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນຄົນຂັບ' },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check for active trip
    const activeTrip = await DriverTrip.findOne({
      driver_id: session.user.id,
      date: today,
      status: 'in_progress'
    });
    
    if (!activeTrip) {
      return NextResponse.json(
        { error: 'ກະລຸນາເລີ່ມການເດີນທາງກ່ອນ' },
        { status: 400 }
      );
    }

    // 🔍 Enhanced Ticket Search - support multiple formats
    let ticket = null;
    let searchResults = [];

    // Try different search strategies
    const searchStrategies = [
      // 1. Direct MongoDB ID
      () => Ticket.findById(ticketId.trim()),
      
      // 2. Exact ticket number match
      () => Ticket.findOne({ ticketNumber: ticketId.trim() }),
      
      // 3. Case-insensitive ticket number
      () => Ticket.findOne({ ticketNumber: { $regex: new RegExp(`^${ticketId.trim()}$`, 'i') } }),
      
      // 4. Partial match (in case of scanning issues)
      () => Ticket.findOne({ ticketNumber: { $regex: ticketId.trim().replace(/[^A-Za-z0-9]/g, ''), $options: 'i' } })
    ];

    for (const strategy of searchStrategies) {
      try {
        ticket = await strategy();
        if (ticket) {
          console.log('✅ Ticket found using strategy');
          break;
        }
      } catch (error) {
        console.log('Strategy failed, trying next...');
        continue;
      }
    }

    if (!ticket) {
      return NextResponse.json(
        { 
          error: 'ບໍ່ພົບຂໍ້ມູນຕັ້ວ',
          details: {
            searchedFor: ticketId.trim(),
            message: 'ກະລຸນາກວດສອບເລກທີ່ປີ້ໃໝ່'
          }
        },
        { status: 404 }
      );
    }

    console.log('🎫 Found ticket:', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      price: ticket.price,
      isFromBooking: ticket.isFromBooking,
      bookingId: ticket.bookingId
    });

    // Check if ticket already scanned in this trip
    const ticketAlreadyScanned = activeTrip.scanned_tickets.some(
      (scan: any) => scan.ticket_id.toString() === ticket._id.toString()
    );
    
    if (ticketAlreadyScanned) {
      // 🔍 Get booking info for duplicate scan message
      let bookingInfo = null;
      if (ticket.isFromBooking && ticket.bookingId) {
        try {
          bookingInfo = await Booking.findById(ticket.bookingId)
            .select('bookingNumber passengerInfo.name passengerInfo.phone');
        } catch (error) {
          console.log('Could not fetch booking info for duplicate scan');
        }
      }

      return NextResponse.json(
        { 
          error: 'ຕັ້ວນີ້ຖືກສະແກນໄປແລ້ວ',
          details: {
            ticketNumber: ticket.ticketNumber,
            ticketType: ticket.isFromBooking ? 'ປີ້ຈອງ' : 'ປີ້ປົກກະຕິ',
            passengerName: bookingInfo?.passengerInfo?.name || null,
            bookingNumber: bookingInfo?.bookingNumber || null,
            message: ticket.isFromBooking && bookingInfo 
              ? `ຕັ້ວຈອງຂອງ ${bookingInfo.passengerInfo.name} (${bookingInfo.bookingNumber})`
              : 'ຕັ້ວນີ້ຖືກສະແກນໃນຮອບນີ້ແລ້ວ'
          }
        },
        { status: 409 }
      );
    }

    // Check if car is full
    if (activeTrip.current_passengers >= activeTrip.car_capacity) {
      return NextResponse.json(
        { error: 'ລົດເຕັມແລ້ວ ບໍ່ສາມາດຮັບຜູ້ໂດຍສານເພີ່ມເຕີມໄດ້' },
        { status: 400 }
      );
    }

    // 🆕 Enhanced: Get Booking Information
    let bookingInfo = null;
    let passengerDetails = null;

    if (ticket.isFromBooking && ticket.bookingId) {
      try {
        bookingInfo = await Booking.findById(ticket.bookingId)
          .select('bookingNumber passengerInfo tripDetails pricing status approvedAt');
        
        if (bookingInfo) {
          passengerDetails = {
            name: bookingInfo.passengerInfo.name,
            phone: bookingInfo.passengerInfo.phone,
            email: bookingInfo.passengerInfo.email,
            bookingNumber: bookingInfo.bookingNumber,
            travelDate: bookingInfo.tripDetails.travelDate,
            totalPassengers: bookingInfo.tripDetails.passengers,
            totalAmount: bookingInfo.pricing.totalAmount,
            approvedAt: bookingInfo.approvedAt
          };
        }
      } catch (error) {
        console.error('Error fetching booking info:', error);
        // Continue without booking info if fetch fails
      }
    }

    // Add passenger to trip
    const passengerOrder = activeTrip.current_passengers + 1;
    
    activeTrip.scanned_tickets.push({
      ticket_id: ticket._id,
      scanned_at: new Date(),
      passenger_order: passengerOrder
    });
    
    activeTrip.current_passengers = passengerOrder;
    
    // Check if 80% capacity reached
    const is80PercentReached = activeTrip.current_passengers >= activeTrip.required_passengers;
    activeTrip.is_80_percent_reached = is80PercentReached;
    
    await activeTrip.save();
    
    // 🎉 Enhanced Success Response
    const occupancyPercentage = Math.round((activeTrip.current_passengers / activeTrip.car_capacity) * 100);
    const progressPercentage = Math.round((activeTrip.current_passengers / activeTrip.required_passengers) * 100);
    
    const responseData = {
      success: true,
      message: ticket.isFromBooking 
        ? `✅ ສະແກນສຳເລັດ: ປີ້ຈອງ ${ticket.ticketNumber}${passengerDetails ? ` - ${passengerDetails.name}` : ''}`
        : `✅ ສະແກນສຳເລັດ: ${ticket.ticketNumber}`,
      
      // Trip status
      trip_status: {
        trip_number: activeTrip.trip_number,
        current_passengers: activeTrip.current_passengers,
        required_passengers: activeTrip.required_passengers,
        car_capacity: activeTrip.car_capacity,
        occupancy_percentage: occupancyPercentage,
        progress_percentage: progressPercentage,
        is_80_percent_reached: is80PercentReached
      },
      
      // 🆕 Enhanced Ticket Information
      ticket_info: {
        id: ticket._id,
        ticket_number: ticket.ticketNumber,
        price: ticket.price,
        payment_method: ticket.paymentMethod,
        passenger_order: passengerOrder,
        scanned_at: new Date(),
        
        // Ticket type identification
        ticket_type: ticket.isFromBooking ? 'booking' : 'walk_in',
        ticket_type_lao: ticket.isFromBooking ? 'ປີ້ຈອງ' : 'ປີ້ປົກກະຕິ',
        
        // 🆕 Booking Details (if available)
        booking_details: passengerDetails ? {
          passenger_name: passengerDetails.name,
          passenger_phone: passengerDetails.phone,
          booking_number: passengerDetails.bookingNumber,
          travel_date: passengerDetails.travelDate,
          total_passengers_in_booking: passengerDetails.totalPassengers,
          booking_amount: passengerDetails.totalAmount,
          approved_at: passengerDetails.approvedAt
        } : null
      },
      
      // Status message for UI
      status_message: is80PercentReached 
        ? `🎉 ຮອບທີ ${activeTrip.trip_number} ບັນລຸເປົ້າໝາຍແລ້ວ! (${activeTrip.current_passengers}/${activeTrip.required_passengers})` 
        : `📊 ຄວາມຄືບໜ້າ: ${activeTrip.current_passengers}/${activeTrip.required_passengers} ຄົນ (${progressPercentage}%)`,
        
      // Additional context
      context: {
        driver_name: driver.name,
        trip_date: today,
        scan_time: new Date().toLocaleString('lo-LA')
      }
    };

    console.log('🎉 Scan successful:', {
      ticketNumber: ticket.ticketNumber,
      isFromBooking: ticket.isFromBooking,
      passengerName: passengerDetails?.name || 'N/A',
      currentPassengers: activeTrip.current_passengers,
      tripNumber: activeTrip.trip_number
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Driver scan error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການສະແກນ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}