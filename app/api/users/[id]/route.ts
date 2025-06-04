// app/api/users/[id]/route.ts - Updated to allow Staff manage Drivers
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Get user by ID - Allow Staff to view Drivers
export async function GET(
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
    
    // Find user by ID
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if Staff can access this user (only drivers)
    if (session.user.role === 'staff' && user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Forbidden - Staff can only access driver information' },
        { status: 403 }
      );
    }
    
    // Convert user to a plain object
    const userData = user.toObject();
    
    // Remove sensitive data
    delete userData.password;
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Get User Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update a user - Allow Staff to update Drivers
export async function PUT(
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
    
    // Get user ID from params
    const userId = params.id;
    
    // Find the user to update
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check permissions - Admin can update all, Staff can only update drivers
    if (session.user.role === 'staff') {
      if (user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Staff can only update drivers' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get update data from request body
    const body = await request.json();
    
    // Create updateData object with fields to update
    const updateData: any = {};
    
    // Add fields to update (excluding sensitive fields)
    const allowedFields = [
      'name', 'email', 'phone', 'status', 'idCardNumber', 
      'idCardImage', 'userImage', 'location', 'birthDate'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    // ถ้ามีการส่งรหัสผ่านมาด้วย (กรณีเปลี่ยนรหัสผ่าน)
    if (body.password) {
      // แฮชรหัสผ่านใหม่
      updateData.password = await bcrypt.hash(body.password, 10);
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update User Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user - Allow Staff to delete Drivers
export async function DELETE(
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
    
    // Get user ID from params
    const userId = params.id;
    
    // Find the user to delete
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check permissions - Admin can delete all, Staff can only delete drivers
    if (session.user.role === 'staff') {
      if (user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Staff can only delete drivers' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user: ' + (error as Error).message },
      { status: 500 }
    );
  }
}