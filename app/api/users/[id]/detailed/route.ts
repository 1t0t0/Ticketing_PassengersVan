// app/api/users/[id]/detailed/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can view detailed user data' },
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
    
    // แปลงข้อมูลผู้ใช้เป็นออบเจ็กต์
    const userData = user.toObject();
    
    // ถอดรหัสแฮชเพื่อรับรหัสผ่านดิบ (สำหรับแอดมินเท่านั้น)
    // หมายเหตุ: bcrypt ไม่สามารถถอดรหัสแฮชได้ ดังนั้นเราไม่สามารถกู้คืนรหัสผ่านดิบได้จริงๆ
    // แนวทางที่เป็นไปได้คือการกำหนดรหัสผ่านว่างเพื่อให้แอดมินกรอกใหม่ หรือใช้รหัสผ่านสำรอง
    userData.unhashedPassword = '********'; // เราจำเป็นต้องให้แอดมินกำหนดรหัสผ่านใหม่
    
    // ลบรหัสผ่านแฮชออกเพื่อความปลอดภัย
    delete userData.password;
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Get Detailed User Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details: ' + (error as Error).message },
      { status: 500 }
    );
  }
}