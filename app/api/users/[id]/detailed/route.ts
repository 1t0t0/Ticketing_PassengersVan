// app/api/users/[id]/detailed/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    
    // Debug: แสดงข้อมูลวันเกิดใน console
    console.log('User birthDate from DB:', {
      userId: userData._id,
      name: userData.name,
      birthDate: userData.birthDate,
      birthDateType: typeof userData.birthDate
    });
    
    // จัดการวันที่ให้อยู่ในรูปแบบที่ถูกต้อง
    if (userData.birthDate) {
      try {
        let formattedDate = '';
        
        // ถ้าเป็น Date object จาก MongoDB
        if (userData.birthDate instanceof Date) {
          // แปลงเป็น YYYY-MM-DD สำหรับ input type="date"
          formattedDate = userData.birthDate.toISOString().split('T')[0];
        } 
        // ถ้าเป็น string แล้ว
        else if (typeof userData.birthDate === 'string') {
          // ลองแปลงเป็น Date object ก่อน
          const date = new Date(userData.birthDate);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          } else {
            // ถ้าแปลงไม่ได้ ให้ใช้ค่าเดิม (อาจเป็น YYYY-MM-DD อยู่แล้ว)
            formattedDate = userData.birthDate;
          }
        }
        
        console.log('Formatted birthDate for response:', formattedDate);
        userData.birthDate = formattedDate;
      } catch (dateError) {
        console.error('Error formatting birthDate in API:', dateError);
        // ถ้าแปลงวันที่ไม่ได้ ให้เป็นค่าว่าง
        userData.birthDate = '';
      }
    }
    
    // ถอดรหัสแฮชเพื่อรับรหัสผ่านดิบ (สำหรับแอดมินเท่านั้น)
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
