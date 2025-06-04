// app/api/users/[id]/route.ts - แก้ไขให้ส่ง userImage กลับมา
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get user by ID - แก้ไขให้ส่ง userImage กลับมา
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 GET /api/users/[id] called with ID:', params.id);
    
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Session found:', {
      userId: session.user.id,
      role: session.user.role,
      requestedId: params.id
    });

    await connectDB();
    console.log('✅ MongoDB connected');
    
    // Find user by ID
    const user = await User.findById(params.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', params.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('👤 User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      hasUserImage: !!user.userImage,
      userImageLength: user.userImage?.length || 0,
      userImagePreview: user.userImage ? user.userImage.substring(0, 50) + '...' : null
    });
    
    // Check if Staff can access this user (only drivers or themselves)
    if (session.user.role === 'staff' && user.role !== 'driver' && user._id.toString() !== session.user.id) {
      console.log('❌ Staff trying to access non-driver user');
      return NextResponse.json(
        { error: 'Forbidden - Staff can only access driver information or their own' },
        { status: 403 }
      );
    }
    
    // Convert user to a plain object
    const userData = user.toObject();
    
    // Remove sensitive data but keep userImage
    delete userData.password;
    
    console.log('📤 Returning user data:', {
      name: userData.name,
      email: userData.email,
      hasUserImage: !!userData.userImage,
      userImageLength: userData.userImage?.length || 0
    });
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('❌ Get User Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT method remains the same...
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
    
    // Check permissions - Admin can update all, Staff can only update drivers or themselves
    if (session.user.role === 'staff') {
      if (user.role !== 'driver' && user._id.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'Forbidden - Staff can only update drivers or themselves' },
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
    
    // Add fields to update (including userImage)
    const allowedFields = [
      'name', 'email', 'phone', 'status', 'idCardNumber', 
      'idCardImage', 'userImage', 'location', 'birthDate'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    // Handle password if provided
    if (body.password) {
      const bcrypt = require('bcryptjs');
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

// DELETE method remains the same...
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