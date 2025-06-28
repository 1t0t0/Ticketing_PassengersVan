// app/api/driver/assigned-tickets/route.ts - FIXED with proper driver assignment filtering
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    console.log('🎫 GET /api/driver/assigned-tickets called');
    
    // ✅ 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      console.log('❌ Unauthorized access:', session?.user?.role);
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can access this endpoint' },
        { status: 401 }
      );
    }

    console.log('✅ Driver authenticated:', session.user.name, session.user.id);

    // ✅ 2. Database Connection
    await connectDB();
    
    const driverId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'assigned'; // assigned, scanned, all
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log(`🎫 Fetching assigned tickets for driver: ${driverId}, status: ${status}, limit: ${limit}`);
    
    // ✅ 3. Build Filter - ใช้ assignedDriverId แทน assignedCarRegistration
    let filter: any = { 
      assignedDriverId: driverId // ✅ FIXED: ใช้ assignedDriverId ตรงๆ
    };
    
    switch (status) {
      case 'assigned':
        filter.isScanned = false;
        break;
      case 'scanned':
        filter.isScanned = true;
        break;
      case 'all':
        // ไม่เพิ่มเงื่อนไข isScanned
        break;
      default:
        filter.isScanned = false; // default to assigned
    }
    
    console.log('🔍 Filter:', JSON.stringify(filter, null, 2));
    
    // ✅ 4. Fetch Tickets with proper population
    const tickets = await Ticket.find(filter)
      .populate('assignedDriverId', 'name employeeId checkInStatus') // ✅ populate driver info
      .sort({ assignedAt: -1, soldAt: -1 }) // เรียงจากล่าสุด
      .limit(limit)
      .lean(); // ใช้ lean() เพื่อ performance ที่ดีขึ้น
    
    console.log(`📊 Found ${tickets.length} tickets for driver ${driverId}`);
    
    // ✅ Debug: แสดงข้อมูลตั๋วที่พบ
    tickets.forEach((ticket, index) => {
      console.log(`📋 Ticket ${index + 1}:`, {
        ticketNumber: ticket.ticketNumber,
        ticketType: ticket.ticketType,
        passengerCount: ticket.passengerCount,
        assignedDriverId: ticket.assignedDriverId?.toString(),
        isScanned: ticket.isScanned,
        soldAt: ticket.soldAt,
        assignedAt: ticket.assignedAt
      });
    });
    
    // ✅ 5. Generate Statistics using aggregation
    const statsData = await Ticket.aggregate([
      { 
        $match: { 
          assignedDriverId: new (require('mongoose').Types.ObjectId)(driverId) 
        } 
      },
      {
        $group: {
          _id: '$isScanned',
          count: { $sum: 1 },
          totalPassengers: { $sum: '$passengerCount' },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);
    
    console.log('📈 Raw statistics data:', statsData);
    
    // ✅ 6. Format Statistics
    const stats = {
      assigned: { count: 0, totalPassengers: 0, totalRevenue: 0 },
      scanned: { count: 0, totalPassengers: 0, totalRevenue: 0 }
    };
    
    statsData.forEach(stat => {
      const key = stat._id ? 'scanned' : 'assigned';
      stats[key] = {
        count: stat.count,
        totalPassengers: stat.totalPassengers,
        totalRevenue: stat.totalRevenue
      };
    });
    
    console.log('📈 Formatted Statistics:', stats);
    
    // ✅ 7. Fetch Driver Info (เพิ่มข้อมูลเสริม)
    const driverInfo = {
      id: driverId,
      name: session.user.name,
      email: session.user.email
    };
    
    // ✅ 8. Response
    const response = {
      success: true,
      tickets: tickets,
      stats: stats,
      driver: driverInfo,
      filter: {
        status: status,
        totalResults: tickets.length,
        limit: limit,
        driverId: driverId
      },
      message: `Found ${tickets.length} ${status} tickets for driver ${session.user.name}`,
      debug: {
        filterUsed: filter,
        ticketIds: tickets.map(t => t.ticketNumber),
        assignmentCheck: `Filtering by assignedDriverId: ${driverId}`
      }
    };
    
    console.log('✅ Response prepared:', {
      ticketCount: tickets.length,
      assignedCount: stats.assigned.count,
      scannedCount: stats.scanned.count
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Get Driver Assigned Tickets Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assigned tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ POST - Mark ticket as scanned (สำหรับอนาคต)
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
    const { ticketId, action = 'mark_scanned' } = body;
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }
    
    const driverId = session.user.id;
    
    // ✅ Find ticket and verify it's assigned to this driver
    const ticket = await Ticket.findOne({
      _id: ticketId,
      assignedDriverId: driverId
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found or not assigned to you' },
        { status: 404 }
      );
    }
    
    // ✅ Handle different actions
    switch (action) {
      case 'mark_scanned':
        if (ticket.isScanned) {
          return NextResponse.json(
            { error: 'Ticket is already scanned' },
            { status: 400 }
          );
        }
        
        ticket.isScanned = true;
        ticket.scannedAt = new Date();
        ticket.scannedBy = driverId;
        
        await ticket.save();
        
        return NextResponse.json({
          success: true,
          ticket: ticket,
          message: `Ticket ${ticket.ticketNumber} marked as scanned`
        });
        
      case 'unmark_scanned':
        // สำหรับยกเลิกการสแกน (ถ้าต้องการ)
        ticket.isScanned = false;
        ticket.scannedAt = null;
        ticket.scannedBy = null;
        
        await ticket.save();
        
        return NextResponse.json({
          success: true,
          ticket: ticket,
          message: `Ticket ${ticket.ticketNumber} unmarked as scanned`
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('💥 Update Assigned Ticket Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update ticket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}