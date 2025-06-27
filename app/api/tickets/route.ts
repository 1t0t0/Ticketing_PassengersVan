// app/api/tickets/route.ts - Enhanced with Driver Assignment Support
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import User from '@/models/User'; // ✅ NEW: Import User model for driver validation
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    
    const candidateNumber = generateUUIDTicketNumber();
    
    console.log(`🎲 Generated candidate: ${candidateNumber} (attempt ${attempt})`);
    
    const existingTicket = await Ticket.findOne({ ticketNumber: candidateNumber });
    
    if (!existingTicket) {
      console.log(`✅ Unique ticket number found: ${candidateNumber}`);
      return candidateNumber;
    }
    
    console.log(`⚠️ ${candidateNumber} already exists, trying again...`);
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
        // ✅ NEW: Driver assignment info
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

// API Route สำหรับสร้าง Ticket - Enhanced with Driver Assignment Support
export async function POST(request: Request) {
  try {
    console.log('🎯 Starting ticket creation with Driver Assignment support...');
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { 
      price, 
      paymentMethod, 
      ticketType = 'individual',
      passengerCount = 1,
      pricePerPerson = 45000,
      destination = 'ຕົວເມືອງ',
      // ✅ NEW: Driver assignment
      assignedDriverId
    } = body;

    console.log('📋 Request data:', { 
      price, 
      paymentMethod, 
      ticketType,
      passengerCount,
      pricePerPerson,
      destination,
      assignedDriverId, // ✅ NEW
      soldBy: session.user.email 
    });

    // ตรวจสอบข้อมูลพื้นฐาน
    if (!price || !paymentMethod) {
      return NextResponse.json(
        { error: 'Price and Payment Method are required' }, 
        { status: 400 }
      );
    }

    // ✅ NEW: Validate assigned driver if provided
    if (assignedDriverId) {
      const assignedDriver = await User.findById(assignedDriverId);
      
      if (!assignedDriver) {
        return NextResponse.json(
          { error: 'Assigned driver not found' },
          { status: 404 }
        );
      }
      
      if (assignedDriver.role !== 'driver') {
        return NextResponse.json(
          { error: 'Assigned user must be a driver' },
          { status: 400 }
        );
      }
      
      console.log(`✅ Driver validation passed: ${assignedDriver.name} (${assignedDriver.employeeId})`);
    }

    // ตรวจสอบความถูกต้องของ Group Ticket
    if (ticketType === 'group') {
      if (passengerCount < 2 || passengerCount > 10) {
        return NextResponse.json(
          { error: 'Group ticket must have 2-10 passengers' },
          { status: 400 }
        );
      }
      
      // ตรวจสอบว่าราคารวมถูกต้อง
      const expectedTotalPrice = pricePerPerson * passengerCount;
      if (price !== expectedTotalPrice) {
        return NextResponse.json(
          { error: `Total price should be ${expectedTotalPrice} (${pricePerPerson} x ${passengerCount})` },
          { status: 400 }
        );
      }
    }

    // ตรวจสอบความถูกต้องของ Individual Ticket
    if (ticketType === 'individual') {
      if (passengerCount !== 1) {
        return NextResponse.json(
          { error: 'Individual ticket must have exactly 1 passenger' },
          { status: 400 }
        );
      }
    }

    // ตรวจสอบและทำความสะอาดปลายทาง
    const cleanDestination = (destination || 'ຕົວເມືອງ').trim();
    if (cleanDestination.length > 100) {
      return NextResponse.json(
        { error: 'Destination name too long (max 100 characters)' },
        { status: 400 }
      );
    }

    // เตรียมข้อมูล ticket
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
      
      // ✅ NEW: Driver Assignment Support
      ...(assignedDriverId && { assignedDriverId })
    };

    // สร้าง ticket ด้วยระบบ UUID
    const ticket = await createTicketSafely(ticketData);

    console.log('🎊 Final ticket created:', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      passengerCount: ticket.passengerCount,
      price: ticket.price,
      pricePerPerson: ticket.pricePerPerson,
      destination: ticket.destination,
      assignedDriverId: ticket.assignedDriverId, // ✅ NEW
      isAssigned: ticket.isAssigned, // ✅ NEW
      soldAt: ticket.soldAt
    });

    // ✅ NEW: Populate driver information if assigned
    let populatedTicket = ticket.toObject();
    if (ticket.assignedDriverId) {
      const driverInfo = await User.findById(ticket.assignedDriverId).select('name employeeId checkInStatus');
      if (driverInfo) {
        populatedTicket.assignedDriver = {
          _id: driverInfo._id,
          name: driverInfo.name,
          employeeId: driverInfo.employeeId,
          checkInStatus: driverInfo.checkInStatus
        };
      }
    }

    // ส่งกลับข้อมูล ticket
    return NextResponse.json(populatedTicket);

  } catch (error) {
    console.error('💥 Ticket Creation Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// API Route สำหรับดึงข้อมูล Ticket - Enhanced with Driver Assignment filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const paymentMethod = searchParams.get('paymentMethod');
    const ticketType = searchParams.get('ticketType');
    const destination = searchParams.get('destination');
    // ✅ NEW: Driver filtering
    const assignedDriverId = searchParams.get('assignedDriverId');
    const assignmentStatus = searchParams.get('assignmentStatus'); // 'assigned', 'unassigned', 'completed'
    
    console.log('📖 GET tickets request:', { 
      page, 
      limit, 
      paymentMethod, 
      ticketType,
      destination,
      assignedDriverId, // ✅ NEW
      assignmentStatus // ✅ NEW
    });
    
    // สร้าง filter
    const filter: any = {};
    
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    if (ticketType && (ticketType === 'individual' || ticketType === 'group')) {
      filter.ticketType = ticketType;
    }
    
    if (destination && destination.trim()) {
      filter.destination = new RegExp(destination.trim(), 'i');
    }
    
    // ✅ NEW: Driver assignment filters
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
    
    // คำนวณ pagination
    const skip = (page - 1) * limit;
    
    // นับจำนวนทั้งหมด
    const totalItems = await Ticket.countDocuments(filter);
    
    // ดึงข้อมูล
    const tickets = await Ticket.find(filter)
      .populate('assignedDriverId', 'name employeeId checkInStatus') // ✅ NEW: Populate driver info
      .sort({ soldAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalPages = Math.ceil(totalItems / limit);
    
    console.log(`📊 Retrieved ${tickets.length} tickets from ${totalItems} total`);
    
    // เพิ่มสถิติ Group vs Individual + Destination + Driver Assignment
    const ticketStats = await Ticket.aggregate([
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
    
    // สถิติปลายทาง
    const destinationStats = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$destination',
          count: { $sum: 1 },
          totalPassengers: { $sum: '$passengerCount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // ✅ NEW: Driver assignment statistics
    const driverAssignmentStats = await Ticket.getDriverAssignmentStats(
      filter.soldAt?.$gte,
      filter.soldAt?.$lte
    );
    
    // ✅ NEW: Driver performance statistics (if filtering by specific driver)
    let driverPerformanceStats = null;
    if (assignedDriverId) {
      driverPerformanceStats = await Ticket.getDriverPerformanceStats(
        assignedDriverId,
        filter.soldAt?.$gte,
        filter.soldAt?.$lte
      );
    }
    
    return NextResponse.json({
      tickets: tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      },
      statistics: statsFormatted,
      destinationStats: destinationStats,
      // ✅ NEW: Driver-related statistics
      driverAssignmentStats: driverAssignmentStats,
      driverPerformanceStats: driverPerformanceStats,
      meta: {
        generationType: 'UUID',
        ticketFormat: 'T + 5 random chars (6 total)',
        sampleFormat: 'TK7M2X',
        supportedTypes: ['individual', 'group'],
        groupTicketLimits: {
          minPassengers: 2,
          maxPassengers: 10
        },
        destinationSupport: {
          enabled: true,
          maxLength: 100,
          defaultDestination: 'ຕົວເມືອງ'
        },
        // ✅ NEW: Driver assignment features
        driverAssignmentSupport: {
          enabled: true,
          assignmentStatuses: ['unassigned', 'assigned', 'completed'],
          features: ['assignment', 'filtering', 'performance_tracking']
        }
      }
    });
    
  } catch (error) {
    console.error('📖 Ticket Fetch Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}