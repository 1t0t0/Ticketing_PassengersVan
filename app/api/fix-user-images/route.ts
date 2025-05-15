// app/api/fix-user-images/route.ts
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
    
    // รายการรูปภาพตัวอย่าง
    const sampleImages = [
      'https://randomuser.me/api/portraits/men/1.jpg',
      'https://randomuser.me/api/portraits/men/2.jpg',
      'https://randomuser.me/api/portraits/men/3.jpg',
      'https://randomuser.me/api/portraits/men/4.jpg',
      'https://randomuser.me/api/portraits/men/5.jpg',
      'https://randomuser.me/api/portraits/women/1.jpg',
      'https://randomuser.me/api/portraits/women/2.jpg',
      'https://randomuser.me/api/portraits/women/3.jpg',
      'https://randomuser.me/api/portraits/women/4.jpg',
      'https://randomuser.me/api/portraits/women/5.jpg',
      'https://randomuser.me/api/portraits/lego/0.jpg',
      'https://randomuser.me/api/portraits/lego/1.jpg',
      'https://randomuser.me/api/portraits/lego/2.jpg',
      'https://randomuser.me/api/portraits/lego/3.jpg',
      'https://randomuser.me/api/portraits/lego/4.jpg',
      'https://randomuser.me/api/portraits/lego/5.jpg',
      'https://randomuser.me/api/portraits/lego/6.jpg',
    ];
    
    // ดึงผู้ใช้ที่ไม่มีรูปภาพหรือรูปภาพไม่ถูกต้อง
    const users = await User.find({
      $or: [
        { userImage: { $exists: false } },
        { userImage: null },
        { userImage: '' },
        { userImage: { $not: /^http/ } } // ไม่ขึ้นต้นด้วย http
      ]
    });
    
    console.log(`Found ${users.length} users with invalid images.`);
    
    // อัปเดตผู้ใช้ทีละคน
    let updateCount = 0;
    for (const user of users) {
      // สุ่มรูปภาพจากรายการ
      const randomIndex = Math.floor(Math.random() * sampleImages.length);
      const randomImage = sampleImages[randomIndex];
      
      console.log(`Updating user ${user.name} (${user._id}) with image: ${randomImage}`);
      
      // อัปเดตผู้ใช้
      await User.findByIdAndUpdate(user._id, {
        $set: { userImage: randomImage }
      });
      
      updateCount++;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updateCount} users with sample images` 
    });
  } catch (error) {
    console.error('Error fixing user images:', error);
    return NextResponse.json({ error: 'Failed to fix user images' }, { status: 500 });
  }
}