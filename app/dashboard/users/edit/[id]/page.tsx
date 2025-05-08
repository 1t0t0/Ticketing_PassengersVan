// app/api/cars/by-driver/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Car from '@/models/Car';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get cars by driver ID
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
    
    // Find cars associated with driver
    const cars = await Car.find({ user_id: params.id });
    
    return NextResponse.json(cars);
  } catch (error) {
    console.error('Get Cars By Driver Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars' },
      { status: 500 }
    );
  }
}

// DELETE - Delete all cars associated with a driver
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Delete all cars associated with driver
    const result = await Car.deleteMany({ user_id: params.id });
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Delete Cars By Driver Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cars' },
      { status: 500 }
    );
  }
}