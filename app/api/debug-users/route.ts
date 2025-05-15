// app/api/debug-users/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const users = await User.find({}).select('name email role userImage');
    
    // แปลงข้อมูลให้อ่านง่าย
    const simplifiedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasUserImage: !!user.userImage,
      userImageValue: user.userImage ? 
        (user.userImage.length > 30 ? 
          user.userImage.substring(0, 30) + '...' : 
          user.userImage) : 
        'No image'
    }));
    
    return NextResponse.json({
      userCount: users.length,
      users: simplifiedUsers
    });
  } catch (error) {
    console.error('Debug Users Error:', error);
    return NextResponse.json({ error: 'Failed to debug users' }, { status: 500 });
  }
}