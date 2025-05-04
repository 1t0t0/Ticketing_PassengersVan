import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const driver = await Driver.findByIdAndUpdate(
      params.id,
      { 
        checkInStatus: 'checked-in',
        lastCheckIn: new Date()
      },
      { new: true }
    );

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json(driver);
  } catch {
    return NextResponse.json({ error: 'Failed to check in driver' }, { status: 500 });
  }
}