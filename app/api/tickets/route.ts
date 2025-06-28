// app/api/tickets/route.ts - Fixed with comprehensive error handling and debugging
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import CarType from '@/models/CarType';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ตัวอักษรที่ใช้ได้ (ไม่รวมตัวที่สับสน)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * สร้าง Ticket Number แบบ UUID (6 ตัวอักษร)
 * รูปแบบ: T + 5 หลักสุ่ม (ทั้ง Individual และ Group ใช้รูปแบบเดียวกัน)
 */
function generateUUIDTicketNumber(): string {
  let result = 'T';
  
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
    result += SAFE_CHARS[randomIndex];
  }
  
  return result;
}

/**
 * สร้าง Ticket Number ที่ไม่ซ้ำแน่นอน
 */
async function generateUniqueTicketNumber(): Promise<string> {
  const maxAttempts = 20;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      const candidateNumber = generateUUIDTicketNumber();
      
      console.log(`🎲 Generated candidate: ${candidateNumber} (attempt ${attempt})`);
      
      const existingTicket = await Ticket.findOne({ ticketNumber: candidateNumber });
      
      if (!existingTicket) {
        console.log(`✅ Unique ticket number found: ${candidateNumber}`);
        return candidateNumber;
      }
      
      console.log(`⚠️ ${candidateNumber} already exists, trying again...`);
    } catch (dbError) {
      console.error(`❌ Database error during ticket number generation (attempt ${attempt}):`, dbError);
      if (attempt >= maxAttempts) {
        throw new Error('Failed to generate unique ticket number due to database errors');
      }
    }
  }
  
  // Emergency fallback
  const timestamp = Date.now().toString().slice(-2);
  const emergency = `T${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${timestamp}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}`;
  
  console.log(`🆘 Using emergency number: ${emergency}`);
  return emergency;
}

/**
 * สร้าง Ticket พร้อมกับการป้องกันการซ้ำ - รองรับ Driver Assignment
 */
async function createTicketSafely(ticketData: any): Promise<any> {
  const maxRetries = 3;
  
  for (let retry = 1; retry <= maxRetries; retry++) {
    try {
      console.log(`💾 Creating ${ticketData.ticketType} ticket (attempt ${retry}/${maxRetries})`);
      
      const ticketNumber = await generateUniqueTicketNumber();
      
      const fullTicketData = {
        ...ticketData,
        ticketNumber
      };
      
      console.log('📝 Ticket data:', {
        ...fullTicketData,
        isGroupTicket: fullTicketData.ticketType === 'group',
        passengerCount: fullTicketData.passengerCount,
        destination: fullTicketData.destination || 'ຕົວເມືອງ',
        hasAssignedDriver: !!fullTicketData.assignedDriverId,
        assignedDriverId: fullTicketData.assignedDriverId
      });
      
      const ticket = await Ticket.create(fullTicketData);
      
      console.log(`🎉 ${ticketData.ticketType} ticket created successfully: ${ticket.ticketNumber} → ${ticket.destination}${ticket.assignedDriverId ? ` (assigned to driver: ${ticket.assignedDriverId})` : ''}`);
      return ticket;
      
    } catch (error: any) {
      console.error(`❌ Create attempt ${retry} failed:`, error.message);
      
      if (error.code === 11000 && retry < maxRetries) {
        console.log(`🔄 Duplicate key detected, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Failed to create ticket after multiple attempts');
}

// ✅ FIXED: POST Route with comprehensive error handling
export async function POST(request: Request) {
  console.log('🎯 POST /api/tickets - Starting ticket creation...');
  
  try {
    // ✅ 1. Session Authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ Session authenticated:', session.user?.email);

    // ✅ 2. Database Connection
    try {
      await connectDB();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: 'Unable to connect to database' },
        { status: 500 }
      );
    }

    // ✅ 3. Parse Request Body
    let body;
    try {
      body = await request.json();
      console.log('✅ Request body parsed:', body);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { 
      price, 
      paymentMethod, 
      ticketType = 'individual',
      passengerCount = 1,
      pricePerPerson = 45000,
      destination = 'ຕົວເມືອງ',
      selectedCarRegistration // ✅ รับ car registration แทน assignedDriverId
    } = body;

    console.log('📋 Parsed request data:', { 
      price, 
      paymentMethod, 
      ticketType,
      passengerCount,
      pricePerPerson,
      destination,
      selectedCarRegistration,
      soldBy: session.user.email 
    });

    // ✅ 4. Basic Validation
    if (!price || !paymentMethod) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Price and Payment Method are required' }, 
        { status: 400 }
      );
    }

    if (!['cash', 'qr'].includes(paymentMethod)) {
      console.error('❌ Invalid payment method:', paymentMethod);
      return NextResponse.json(
        { error: 'Payment method must be "cash" or "qr"' },
        { status: 400 }
      );
    }

    // ✅ 5. Driver Assignment Logic - แปลง Car Registration → Driver ID
    let assignedDriverId = null;
    let carInfo = null;
    let assignmentInfo = null;
    
    if (selectedCarRegistration) {
      try {
        console.log(`🚗 Looking up driver for car: ${selectedCarRegistration}`);
        
        // ดึงข้อมูลรถและคนขับ
        const Car = mongoose.models.Car || (await import('@/models/Car')).default;
        carInfo = await Car.findOne({ 
          car_registration: selectedCarRegistration 
        }).populate('user_id', '_id name employeeId checkInStatus phone');
        
        if (carInfo && carInfo.user_id) {
          assignedDriverId = carInfo.user_id._id;
          
          // ตรวจสอบว่าคนขับ check-in แล้วหรือไม่
          if (carInfo.user_id.checkInStatus === 'checked-in') {
            assignmentInfo = {
              driverId: assignedDriverId,
              driverName: carInfo.user_id.name,
              driverEmployeeId: carInfo.user_id.employeeId,
              carRegistration: selectedCarRegistration,
              carName: carInfo.car_name,
              carCapacity: carInfo.car_capacity,
              assignedAt: new Date()
            };
            
            console.log(`✅ Assigned to checked-in driver: ${carInfo.user_id.name} (${carInfo.user_id.employeeId})`);
          } else {
            console.log(`⚠️ Driver ${carInfo.user_id.name} is not checked-in, assignment will be pending`);
            assignmentInfo = {
              driverId: assignedDriverId,
              driverName: carInfo.user_id.name,
              driverEmployeeId: carInfo.user_id.employeeId,
              carRegistration: selectedCarRegistration,
              carName: carInfo.car_name,
              carCapacity: carInfo.car_capacity,
              assignedAt: new Date(),
              note: 'Driver not checked-in'
            };
          }
        } else {
          console.warn(`❌ Car ${selectedCarRegistration} not found or has no assigned driver`);
        }
      } catch (carLookupError) {
        console.error('❌ Error looking up car/driver:', carLookupError);
        // ไม่ให้ error นี้หยุดการสร้างตั๋ว - แค่ไม่ assign driver
      }
    }

    // ✅ 6. Group Ticket Validation
    if (ticketType === 'group') {
      if (passengerCount < 2 || passengerCount > 10) {
        console.error('❌ Invalid group ticket passenger count:', passengerCount);
        return NextResponse.json(
          { error: 'Group ticket must have 2-10 passengers' },
          { status: 400 }
        );
      }
      
      const expectedTotalPrice = pricePerPerson * passengerCount;
      if (price !== expectedTotalPrice) {
        console.error('❌ Group ticket price mismatch:', { expected: expectedTotalPrice, actual: price });
        return NextResponse.json(
          { error: `Total price should be ${expectedTotalPrice} (${pricePerPerson} x ${passengerCount})` },
          { status: 400 }
        );
      }
    }

    // ✅ 7. Individual Ticket Validation
    if (ticketType === 'individual' && passengerCount !== 1) {
      console.error('❌ Individual ticket must have exactly 1 passenger:', passengerCount);
      return NextResponse.json(
        { error: 'Individual ticket must have exactly 1 passenger' },
        { status: 400 }
      );
    }

    // ✅ 8. Destination Validation
    const cleanDestination = (destination || 'ຕົວເມືອງ').trim();
    if (cleanDestination.length > 100) {
      console.error('❌ Destination name too long:', cleanDestination.length);
      return NextResponse.json(
        { error: 'Destination name too long (max 100 characters)' },
        { status: 400 }
      );
    }

    // ✅ 9. Prepare Ticket Data
    const ticketData = {
      price: Number(price),
      paymentMethod,
      soldBy: session.user.email || session.user.name || 'System',
      soldAt: new Date(),
      
      // Group Ticket Support
      ticketType,
      passengerCount: Number(passengerCount),
      pricePerPerson: Number(pricePerPerson),
      
      // Destination Support
      destination: cleanDestination,
      
      // ✅ Driver Assignment Support
      assignedDriverId: assignedDriverId,
      isAssigned: !!assignedDriverId,
      assignedAt: assignedDriverId ? new Date() : null
    };

    console.log('✅ Final ticket data prepared:', {
      ...ticketData,
      hasDriverAssignment: !!assignedDriverId
    });

    // ✅ 10. Create Ticket
    let ticket;
    try {
      ticket = await createTicketSafely(ticketData);
      console.log('✅ Ticket created successfully:', ticket.ticketNumber);
    } catch (createError) {
      console.error('❌ Error creating ticket:', createError);
      return NextResponse.json(
        { 
          error: 'Failed to create ticket',
          details: createError instanceof Error ? createError.message : 'Unknown error during ticket creation'
        },
        { status: 500 }
      );
    }

    // ✅ 11. Prepare Response with Assignment Info
    const response = {
      ...ticket.toObject(),
      assignmentInfo: assignmentInfo, // ข้อมูลการ assign driver
      success: true,
      message: assignmentInfo 
        ? `Ticket created and assigned to ${assignmentInfo.driverName}` 
        : 'Ticket created successfully'
    };

    console.log('🎊 Ticket creation completed successfully:', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      destination: ticket.destination,
      assignedDriver: assignmentInfo?.driverName || 'None'
    });

    // ✅ 12. Return Success Response
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('💥 Unexpected error in POST /api/tickets:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error during ticket creation',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// ✅ FIXED: GET Route with comprehensive error handling
export async function GET(request: Request) {
  console.log('📖 GET /api/tickets - Starting ticket fetch...');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const paymentMethod = searchParams.get('paymentMethod');
    const ticketType = searchParams.get('ticketType');
    const destination = searchParams.get('destination');
    
    // ✅ NEW: Driver Assignment Filters
    const assignedDriverId = searchParams.get('assignedDriverId');
    const assignmentStatus = searchParams.get('assignmentStatus'); // unassigned, assigned, completed
    
    console.log('📋 Query parameters:', { 
      page, limit, paymentMethod, ticketType, destination,
      assignedDriverId, assignmentStatus
    });
    
    // ✅ Build Filter with Driver Assignment Support
    const filter: any = {};
    
    if (paymentMethod && ['cash', 'qr'].includes(paymentMethod)) {
      filter.paymentMethod = paymentMethod;
    }
    
    if (ticketType && ['individual', 'group'].includes(ticketType)) {
      filter.ticketType = ticketType;
    }
    
    if (destination && destination.trim()) {
      filter.destination = new RegExp(destination.trim(), 'i');
    }
    
    // ✅ Driver Assignment Filters
    if (assignedDriverId) {
      filter.assignedDriverId = assignedDriverId;
    }
    
    if (assignmentStatus) {
      switch (assignmentStatus) {
        case 'unassigned':
          filter.$or = [
            { assignedDriverId: null },
            { assignedDriverId: { $exists: false } }
          ];
          break;
        case 'assigned':
          filter.assignedDriverId = { $ne: null, $exists: true };
          filter.isScanned = false;
          break;
        case 'completed':
          filter.isScanned = true;
          break;
      }
    }
    
    console.log('🔍 Final filter:', filter);
    
    const skip = (page - 1) * limit;
    
    let totalItems;
    try {
      totalItems = await Ticket.countDocuments(filter);
      console.log(`📊 Total items found: ${totalItems}`);
    } catch (countError) {
      console.error('❌ Error counting tickets:', countError);
      return NextResponse.json(
        { error: 'Error counting tickets' },
        { status: 500 }
      );
    }
    
    // ✅ Fetch Tickets with Driver Population
    let tickets;
    try {
      tickets = await Ticket.find(filter)
        .populate('assignedDriverId', 'name employeeId checkInStatus phone') // ✅ Populate driver info
        .sort({ soldAt: -1 })
        .skip(skip)
        .limit(limit);
      
      console.log(`✅ Retrieved ${tickets.length} tickets`);
      
    } catch (fetchError) {
      console.error('❌ Error fetching tickets:', fetchError);
      return NextResponse.json(
        { 
          error: 'Error fetching tickets from database',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    const totalPages = Math.ceil(totalItems / limit);
    
    // ✅ Generate Enhanced Statistics with Driver Assignment
    let ticketStats;
    try {
      ticketStats = await Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$ticketType',
            count: { $sum: 1 },
            totalPassengers: { $sum: '$passengerCount' },
            totalRevenue: { $sum: '$price' }
          }
        }
      ]);
      
      console.log('✅ Statistics generated:', ticketStats);
    } catch (statsError) {
      console.error('⚠️ Error generating statistics, continuing without them:', statsError);
      ticketStats = [];
    }
    
    const statsFormatted = {
      individual: { count: 0, totalPassengers: 0, totalRevenue: 0 },
      group: { count: 0, totalPassengers: 0, totalRevenue: 0 }
    };
    
    ticketStats.forEach(stat => {
      if (stat._id === 'individual' || stat._id === 'group') {
        statsFormatted[stat._id] = {
          count: stat.count,
          totalPassengers: stat.totalPassengers,
          totalRevenue: stat.totalRevenue
        };
      }
    });
    
    // ✅ Generate Driver Assignment Statistics
    let driverAssignmentStats = null;
    try {
      const assignmentStatsResult = await Ticket.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            assignedTickets: {
              $sum: {
                $cond: [{ $ne: ['$assignedDriverId', null] }, 1, 0]
              }
            },
            scannedTickets: {
              $sum: {
                $cond: ['$isScanned', 1, 0]
              }
            }
          }
        }
      ]);
      
      if (assignmentStatsResult.length > 0) {
        const result = assignmentStatsResult[0];
        driverAssignmentStats = {
          ...result,
          unassignedTickets: result.totalTickets - result.assignedTickets,
          pendingTickets: result.assignedTickets - result.scannedTickets
        };
      }
    } catch (assignStatsError) {
      console.warn('⚠️ Error generating driver assignment statistics:', assignStatsError);
    }

    const response = {
      tickets: tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      },
      statistics: statsFormatted,
      driverAssignmentStats: driverAssignmentStats,
      meta: {
        generationType: 'UUID',
        ticketFormat: 'T + 5 random chars (6 total)',
        sampleFormat: 'TK7M2X',
        supportedTypes: ['individual', 'group'],
        driverAssignmentSupport: {
          enabled: true,
          assignmentStatuses: ['unassigned', 'assigned', 'completed'],
          features: ['assignment', 'filtering', 'performance_tracking']
        }
      }
    };

    console.log(`✅ GET /api/tickets completed successfully: ${tickets.length} tickets returned`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/tickets:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Internal server error during ticket fetch',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}