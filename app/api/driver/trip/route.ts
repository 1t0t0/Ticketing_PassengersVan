// app/api/driver/trip/route.ts - Enhanced GET method with Booking Integration
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverTrip from '@/models/DriverTrip';
import User from '@/models/User';
import Car from '@/models/Car';
import Ticket from '@/models/Ticket';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Enhanced with Booking Information
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can access trip status' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const driverId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🚗 Fetching trip status for driver:', session.user.email, 'Date:', today);

    // Get driver info
    const driver = await User.findById(driverId);
    if (!driver) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນຄົນຂັບ' },
        { status: 404 }
      );
    }

    // Find active trip
    const activeTrip = await DriverTrip.findOne({
      driver_id: driverId,
      date: today,
      status: 'in_progress'
    }).populate({
      path: 'scanned_tickets.ticket_id',
      select: 'ticketNumber price paymentMethod soldBy isFromBooking bookingId soldAt'
    });

    // Count completed trips today
    const completedTrips = await DriverTrip.find({
      driver_id: driverId,
      date: today,
      status: 'completed'
    });

    const totalCompletedTrips = completedTrips.length;
    const qualifiesForRevenue = totalCompletedTrips >= 2;

    let tripStatusResponse = {
      has_active_trip: !!activeTrip,
      active_trip: null as any,
      completed_trips_today: totalCompletedTrips,
      qualifies_for_revenue: qualifiesForRevenue,
      revenue_status: qualifiesForRevenue 
        ? 'ມີສິດຮັບສ່ວນແບ່ງລາຍຮັບ 85%' 
        : `ຕ້ອງທຳອີກ ${2 - totalCompletedTrips} ຮອບເພື່ອໄດ້ຮັບສ່ວນແບ່ງລາຍຮັບ`
    };

    if (activeTrip) {
      // 🆕 Enhanced: Get detailed passenger information with booking data
      const enhancedPassengers = await Promise.all(
        activeTrip.scanned_tickets.map(async (scan: any) => {
          const ticket = scan.ticket_id;
          if (!ticket) return null;

          let bookingDetails = null;
          
          // 🔍 If ticket is from booking, get booking information
          if (ticket.isFromBooking && ticket.bookingId) {
            try {
              const booking = await Booking.findById(ticket.bookingId)
                .select('bookingNumber passengerInfo tripDetails pricing');
              
              if (booking) {
                bookingDetails = {
                  booking_number: booking.bookingNumber,
                  passenger_name: booking.passengerInfo.name,
                  passenger_phone: booking.passengerInfo.phone,
                  passenger_email: booking.passengerInfo.email,
                  total_passengers_in_booking: booking.tripDetails.passengers,
                  booking_amount: booking.pricing.totalAmount,
                  travel_date: booking.tripDetails.travelDate
                };
              }
            } catch (error) {
              console.error('Error fetching booking details for ticket:', ticket._id, error);
            }
          }

          return {
            order: scan.passenger_order,
            ticket_number: ticket.ticketNumber,
            scanned_at: scan.scanned_at,
            
            // 🆕 Enhanced ticket information
            ticket_details: {
              id: ticket._id,
              price: ticket.price,
              payment_method: ticket.paymentMethod,
              sold_by: ticket.soldBy,
              sold_at: ticket.soldAt,
              
              // Ticket type
              ticket_type: ticket.isFromBooking ? 'booking' : 'walk_in',
              ticket_type_lao: ticket.isFromBooking ? 'ປີ້ຈອງ' : 'ປີ້ປົກກະຕິ',
              
              // 🆕 Booking details (if available)
              booking_details: bookingDetails
            }
          };
        })
      );

      // Filter out null results and sort by order
      const validPassengers = enhancedPassengers
        .filter(p => p !== null)
        .sort((a, b) => a.order - b.order);

      tripStatusResponse.active_trip = {
        trip_id: activeTrip._id,
        trip_number: activeTrip.trip_number,
        current_passengers: activeTrip.current_passengers,
        required_passengers: activeTrip.required_passengers,
        car_capacity: activeTrip.car_capacity,
        started_at: activeTrip.started_at,
        
        // 🆕 Enhanced passenger list with booking information
        passengers: validPassengers,
        
        // 🆕 Additional trip statistics
        trip_stats: {
          occupancy_percentage: Math.round((activeTrip.current_passengers / activeTrip.car_capacity) * 100),
          progress_percentage: Math.round((activeTrip.current_passengers / activeTrip.required_passengers) * 100),
          is_80_percent_reached: activeTrip.is_80_percent_reached,
          
          // Passenger breakdown by type
          passenger_breakdown: {
            walk_in_count: validPassengers.filter(p => p.ticket_details.ticket_type === 'walk_in').length,
            booking_count: validPassengers.filter(p => p.ticket_details.ticket_type === 'booking').length,
            total_revenue: validPassengers.reduce((sum, p) => sum + p.ticket_details.price, 0)
          }
        }
      };

      console.log('📊 Active trip found:', {
        tripNumber: activeTrip.trip_number,
        passengers: activeTrip.current_passengers,
        bookingPassengers: tripStatusResponse.active_trip.trip_stats.passenger_breakdown.booking_count,
        walkInPassengers: tripStatusResponse.active_trip.trip_stats.passenger_breakdown.walk_in_count
      });
    }

    console.log('✅ Trip status response prepared:', {
      hasActiveTrip: tripStatusResponse.has_active_trip,
      completedTrips: tripStatusResponse.completed_trips_today,
      qualifiesForRevenue: tripStatusResponse.qualifies_for_revenue
    });

    return NextResponse.json({
      success: true,
      data: tripStatusResponse
    });

  } catch (error) {
    console.error('❌ Get trip status error:', error);
    return NextResponse.json(
      {
        error: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການເດີນທາງ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST method remains the same for starting new trips
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can start trips' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const driverId = session.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🚀 Starting new trip for driver:', session.user.email);

    // Check if driver has an active trip
    const existingTrip = await DriverTrip.findOne({
      driver_id: driverId,
      date: today,
      status: 'in_progress'
    });
    
    if (existingTrip) {
      return NextResponse.json(
        { error: 'ທ່ານມີການເດີນທາງທີ່ກຳລັງດຳເນີນການຢູ່ແລ້ວ' },
        { status: 400 }
      );
    }

    // Get driver and car information
    const driver = await User.findById(driverId);
    if (!driver) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນຄົນຂັບ' },
        { status: 404 }
      );
    }

    const car = await Car.findOne({ user_id: driverId });
    if (!car) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນລົດທີ່ມອບໝາຍໃຫ້' },
        { status: 404 }
      );
    }

    // Calculate trip number for today
    const tripsToday = await DriverTrip.find({
      driver_id: driverId,
      date: today
    }).sort({ trip_number: -1 });

    const nextTripNumber = tripsToday.length > 0 ? tripsToday[0].trip_number + 1 : 1;
    
    // Calculate required passengers (80% of car capacity)
    const requiredPassengers = Math.ceil(car.car_capacity * 0.8);

    // Create new trip
    const newTrip = new DriverTrip({
      driver_id: driverId,
      car_id: car._id,
      trip_number: nextTripNumber,
      date: today,
      status: 'in_progress',
      scanned_tickets: [],
      car_capacity: car.car_capacity,
      required_passengers: requiredPassengers,
      current_passengers: 0,
      is_80_percent_reached: false,
      started_at: new Date()
    });

    await newTrip.save();

    console.log('🎉 New trip created:', {
      tripNumber: nextTripNumber,
      carCapacity: car.car_capacity,
      requiredPassengers: requiredPassengers,
      driverName: driver.name
    });

    return NextResponse.json({
      success: true,
      message: `ເລີ່ມການເດີນທາງຮອບທີ ${nextTripNumber} ສຳເລັດ!`,
      trip: {
        trip_id: newTrip._id,
        trip_number: nextTripNumber,
        car_capacity: car.car_capacity,
        required_passengers: requiredPassengers,
        started_at: newTrip.started_at
      }
    });

  } catch (error) {
    console.error('❌ Start trip error:', error);
    return NextResponse.json(
      {
        error: 'ເກີດຂໍ້ຜິດພາດໃນການເລີ່ມການເດີນທາງ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}