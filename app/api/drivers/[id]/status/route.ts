// app/api/drivers/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin or staff
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { status } = await request.json();
    
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be active or inactive' 
      }, { status: 400 });
    }
    
    const driver = await Driver.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    );

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // If setting to inactive, also check out the driver
    if (status === 'inactive' && driver.checkInStatus === 'checked-in') {
      await Driver.findByIdAndUpdate(
        params.id,
        { 
          checkInStatus: 'checked-out',
          lastCheckOut: new Date()
        }
      );
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update driver status' 
    }, { status: 500 });
  }
}