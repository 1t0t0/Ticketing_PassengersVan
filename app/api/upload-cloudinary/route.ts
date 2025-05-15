// app/api/upload-cloudinary/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    // ตรวจสอบการ authenticate
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // รับข้อมูลรูปภาพ
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const type = formData.get('type') as string; // 'idCard' หรือ 'user'
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // แปลงไฟล์เป็น Base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;

    // กำหนดโฟลเดอร์ตามประเภทรูปภาพ
    const folder = `bus-ticket-system/${type === 'idCard' ? 'id-cards' : 'profile-images'}`;

    // อัปโหลดไปยัง Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder,
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto" }
      ]
    });

    // ส่งคืน URL ของรูปภาพ
    // app/api/upload-cloudinary/route.ts
// ส่วนที่ส่งคืน JSON response
return new NextResponse(
  JSON.stringify({ 
    success: true, 
    url: uploadResult.secure_url
  }),
  {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  }
);
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}