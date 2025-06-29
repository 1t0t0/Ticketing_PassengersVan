// app/api/tickets/[id]/assignment/route.ts - API สำหรับจัดการการมอบหมายตั๋ว
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// DELETE - ยกเลิกการมอบหมายตั๋ว (Remove ticket assignment)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🗑️ DELETE ticket assignment request:', {
      ticketId: params.id,
      requestedBy: session.user?.email
    });

    // ✅ 2. Database Connection
    await connectDB();
    
    // ✅ 3. Find the ticket
    const ticket = await Ticket.findById(params.id);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    console.log('🎫 Found ticket:', {
      ticketNumber: ticket.ticketNumber,
      isAssigned: !!ticket.assignedDriverId,
      isScanned: ticket.isScanned,
      assignedDriverId: ticket.assignedDriverId?.toString()
    });

    // ✅ 4. Check if ticket is assigned
    if (!ticket.assignedDriverId) {
      return NextResponse.json(
        { error: 'Ticket is not assigned to any driver' },
        { status: 400 }
      );
    }

    // ✅ 5. Security Check - Only allow deletion if:
    // - User is admin, OR
    // - User is the assigned driver and ticket is not scanned yet
    const isAdmin = session.user.role === 'admin';
    const isAssignedDriver = ticket.assignedDriverId.toString() === session.user.id;
    const canDelete = isAdmin || (isAssignedDriver && !ticket.isScanned);

    if (!canDelete) {
      if (ticket.isScanned) {
        return NextResponse.json(
          { error: 'Cannot remove assignment - ticket has already been scanned' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { error: 'Permission denied - you can only remove your own unscanned ticket assignments' },
          { status: 403 }
        );
      }
    }

    // ✅ 6. Store info before deletion for logging
    const assignmentInfo = {
      ticketNumber: ticket.ticketNumber,
      ticketType: ticket.ticketType,
      passengerCount: ticket.passengerCount,
      price: ticket.price,
      assignedDriverId: ticket.assignedDriverId.toString(),
      assignedAt: ticket.assignedAt,
      removedBy: session.user.id,
      removedByRole: session.user.role,
      removedAt: new Date()
    };

    // ✅ 7. Remove the assignment
    const updatedTicket = await Ticket.findByIdAndUpdate(
      params.id,
      {
        $unset: {
          assignedDriverId: 1,
          assignedAt: 1
        },
        $set: {
          isAssigned: false
        }
      },
      { new: true }
    );

    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Failed to remove ticket assignment' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully removed ticket assignment:', assignmentInfo);

    // ✅ 8. Return success response
    return NextResponse.json({
      success: true,
      message: `Ticket assignment removed successfully`,
      ticket: {
        id: updatedTicket._id,
        ticketNumber: updatedTicket.ticketNumber,
        isAssigned: false,
        assignedDriverId: null,
        assignedAt: null
      },
      assignmentInfo: assignmentInfo
    });

  } catch (error) {
    console.error('💥 Error removing ticket assignment:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to remove ticket assignment',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทการมอบหมายตั๋ว (Update ticket assignment)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ 1. Authentication Check - เฉพาะ admin เท่านั้น
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can update ticket assignments' },
        { status: 401 }
      );
    }

    console.log('📝 PUT ticket assignment request:', {
      ticketId: params.id,
      requestedBy: session.user?.email
    });

    // ✅ 2. Database Connection
    await connectDB();
    
    // ✅ 3. Parse request body
    const body = await request.json();
    const { driverId } = body;
    
    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // ✅ 4. Find the ticket
    const ticket = await Ticket.findById(params.id);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // ✅ 5. Check if ticket is already scanned
    if (ticket.isScanned) {
      return NextResponse.json(
        { error: 'Cannot reassign - ticket has already been scanned' },
        { status: 400 }
      );
    }

    // ✅ 6. Verify driver exists and is a driver
    const User = (await import('@/models/User')).default;
    const driver = await User.findById(driverId);
    
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }
    
    if (driver.role !== 'driver') {
      return NextResponse.json(
        { error: 'User is not a driver' },
        { status: 400 }
      );
    }

    // ✅ 7. Update the assignment
    const updatedTicket = await Ticket.findByIdAndUpdate(
      params.id,
      {
        assignedDriverId: driverId,
        assignedAt: new Date(),
        isAssigned: true
      },
      { new: true }
    ).populate('assignedDriverId', 'name employeeId checkInStatus');

    console.log('✅ Successfully updated ticket assignment:', {
      ticketNumber: updatedTicket.ticketNumber,
      newDriverId: driverId,
      driverName: driver.name
    });

    // ✅ 8. Return success response
    return NextResponse.json({
      success: true,
      message: `Ticket reassigned to ${driver.name} successfully`,
      ticket: updatedTicket,
      assignmentInfo: {
        ticketNumber: updatedTicket.ticketNumber,
        assignedDriverId: driverId,
        driverName: driver.name,
        driverEmployeeId: driver.employeeId,
        assignedAt: updatedTicket.assignedAt,
        updatedBy: session.user.id
      }
    });

  } catch (error) {
    console.error('💥 Error updating ticket assignment:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to update ticket assignment',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET - ดูข้อมูลการมอบหมายตั๋ว (Get ticket assignment info)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ 2. Database Connection
    await connectDB();
    
    // ✅ 3. Find ticket with populated driver info
    const ticket = await Ticket.findById(params.id)
      .populate('assignedDriverId', 'name employeeId checkInStatus phone');
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // ✅ 4. Return assignment info
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        ticketType: ticket.ticketType,
        passengerCount: ticket.passengerCount,
        price: ticket.price,
        destination: ticket.destination,
        soldAt: ticket.soldAt,
        soldBy: ticket.soldBy,
        isAssigned: !!ticket.assignedDriverId,
        assignedDriverId: ticket.assignedDriverId?._id,
        assignedAt: ticket.assignedAt,
        isScanned: ticket.isScanned,
        scannedAt: ticket.scannedAt,
        assignedDriver: ticket.assignedDriverId ? {
          id: ticket.assignedDriverId._id,
          name: ticket.assignedDriverId.name,
          employeeId: ticket.assignedDriverId.employeeId,
          checkInStatus: ticket.assignedDriverId.checkInStatus,
          phone: ticket.assignedDriverId.phone
        } : null
      }
    });

  } catch (error) {
    console.error('💥 Error getting ticket assignment:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to get ticket assignment',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}