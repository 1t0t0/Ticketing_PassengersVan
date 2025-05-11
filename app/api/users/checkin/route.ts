// app/api/users/checkin/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkUserPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/authUtils';

// POST - Check in/out a user or driver
export async function POST(request: Request) {
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
    
    // Parse request body
    const body = await request.json();
    const { userId, action } = body;
    
    // Validate required fields
    if (!userId || !action || (action !== 'check-in' && action !== 'check-out')) {
      return NextResponse.json(
        { error: 'User ID and valid action (check-in or check-out) are required' },
        { status: 400 }
      );
    }
    
    // Special case: user checking themselves in/out (staff only)
    const isSelfCheckIn = userId === session.user.id;
    
    // Check permissions:
    // 1. Admin can check-in/out anyone
    // 2. Staff can check-in/out drivers
    // 3. Staff can check-in/out themselves
    const isAdmin = session.user.role === 'admin';
    const isStaff = session.user.role === 'staff';
    const hasDriverCheckInPermission = checkUserPermission(session, PERMISSIONS.CHECK_IN_DRIVERS);
    
    if (!isAdmin && (!hasDriverCheckInPermission || (isSelfCheckIn && !isStaff))) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update check-in status based on action
    const updateData: any = {};
    const now = new Date();
    
    if (action === 'check-in') {
      updateData.checkInStatus = 'checked-in';
      updateData.lastCheckIn = now;
    } else {
      updateData.checkInStatus = 'checked-out';
      updateData.lastCheckOut = now;
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Check-in/out Error:', error);
    return NextResponse.json(
      { error: 'Failed to process check-in/out: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Get check-in status for all drivers or a specific user
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
    
    // Get query parameters (optional)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // If userId is provided, get check-in status for that user
    if (userId) {
      // Allow users to get their own status or admin to get anyone's status
      if (userId !== session.user.id && session.user.role !== 'admin' && !checkUserPermission(session, PERMISSIONS.CHECK_IN_DRIVERS)) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }
      
      const user = await User.findById(userId).select('name employeeId checkInStatus lastCheckIn lastCheckOut role');
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(user);
    }
    
    // Otherwise, get check-in status for all drivers and staff
    // Only admin and staff with CHECK_IN_DRIVERS permission can see all drivers status
    if (session.user.role !== 'admin' && !checkUserPermission(session, PERMISSIONS.CHECK_IN_DRIVERS)) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const users = await User.find({ role: { $in: ['driver', 'staff'] } })
      .select('name employeeId checkInStatus lastCheckIn lastCheckOut role')
      .sort({ name: 1 });
    
    // Group by role for easier client-side processing
    const grouped = {
      drivers: users.filter(user => user.role === 'driver'),
      staff: users.filter(user => user.role === 'staff')
    };
    
    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Get Check-in Status Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in status: ' + (error as Error).message },
      { status: 500 }
    );
  }
}