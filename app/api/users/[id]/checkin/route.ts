// app/api/users/[id]/checkin/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - Set check in/out status for a user
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { checkInStatus } = body;
    
    // Validate status
    if (!checkInStatus || !['checked-in', 'checked-out'].includes(checkInStatus)) {
      return NextResponse.json(
        { error: 'Invalid check in status' },
        { status: 400 }
      );
    }
    
    // Find user by ID
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is driver or staff
    if (!['driver', 'staff'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only drivers and staff can be checked in/out' },
        { status: 400 }
      );
    }
    
    // Check permissions
    
    // 1. Admin can check in/out anyone
    // 2. Staff can check in/out themselves and drivers
    // 3. Driver can't check in/out anyone
    
    const currentUserRole = session.user.role;
    const currentUserId = session.user.id;
    const targetUserId = params.id;
    const targetUserRole = user.role;
    
    // If admin, allow all cases
    if (currentUserRole === 'admin') {
      // Allow access
    }
    // If staff
    else if (currentUserRole === 'staff') {
      // Staff can change their own status or driver status
      if (targetUserRole === 'staff' && targetUserId !== currentUserId) {
        // Staff can't change other staff status
        return NextResponse.json(
          { error: 'Staff can only change status of themselves or drivers' },
          { status: 403 }
        );
      }
    }
    // If driver or other roles
    else {
      // Driver and other roles can't change check in status
      return NextResponse.json(
        { error: 'You do not have permission to change check in status' },
        { status: 403 }
      );
    }
    
    // Update check in status
    let updateData: any = {
      checkInStatus
    };
    
    // Add timestamp for last check in/out
    if (checkInStatus === 'checked-in') {
      updateData.lastCheckIn = new Date();
    } else {
      updateData.lastCheckOut = new Date();
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Check In/Out Error:', error);
    return NextResponse.json(
      { error: 'Failed to update check in status' },
      { status: 500 }
    );
  }
}