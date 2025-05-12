// app/api/users/[id]/route.ts - Update this file to include a PUT method

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Car from '@/models/Car';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT - Update a user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization (only admin can update users)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can update users' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get user ID from params
    const userId = params.id;
    
    // Get update data from request body
    const body = await request.json();
    
    // Find the user to update
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Extract car data if present
    const carData = body.car;
    delete body.car;
    
    // Create updateData object with fields to update
    const updateData: any = {};
    
    // Add fields to update (excluding sensitive fields)
    const allowedFields = [
      'name', 'email', 'phone', 'status', 'idCardNumber', 
      'idCardImage', 'userImage', 'location'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    // Update car data if user is a driver and car data is provided
    if (user.role === 'driver' && carData) {
      // Find car associated with driver
      const car = await Car.findOne({ user_id: userId });
      
      if (car) {
        // Update car details
        const allowedCarFields = [
          'car_name', 'car_capacity', 'car_registration', 'car_type'
        ];
        
        const carUpdateData: any = {};
        
        allowedCarFields.forEach(field => {
          if (carData[field] !== undefined) {
            carUpdateData[field] = carData[field];
          }
        });
        
        // Update car
        await Car.findByIdAndUpdate(
          car._id,
          { $set: carUpdateData },
          { new: true }
        );
      }
    }
    
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