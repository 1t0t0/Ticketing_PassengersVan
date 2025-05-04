// app/api/drivers/[id]/check-in/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const driver = await Driver.findById(params.id);
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Check if driver is active
    if (driver.status !== 'active') {
      return NextResponse.json({ 
        error: 'Cannot check in - Driver is inactive' 
      }, { status: 400 });
    }

    // Check if already checked in
    if (driver.checkInStatus === 'checked-in') {
      return NextResponse.json({ 
        error: 'Driver is already checked in' 
      }, { status: 400 });
    }
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      params.id,
      { 
        checkInStatus: 'checked-in',
        lastCheckIn: new Date()
      },
      { new: true }
    );

    return NextResponse.json(updatedDriver);
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ 
      error: 'Failed to check in driver' 
    }, { status: 500 });
  }
}