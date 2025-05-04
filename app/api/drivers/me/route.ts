import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // หา driver จาก email ของ user ที่ login
    const driver = await Driver.findOne({ email: session.user.email });
    
    if (!driver) {
      // ถ้าไม่เจอ ให้ลองหาจากชื่อ
      const driverByName = await Driver.findOne({ name: session.user.name });
      
      if (!driverByName) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      
      return NextResponse.json(driverByName);
    }
    
    return NextResponse.json(driver);
    
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver profile' }, 
      { status: 500 }
    );
  }
}