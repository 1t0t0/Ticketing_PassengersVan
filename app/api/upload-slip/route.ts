// app/api/upload-slip/route.ts
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// POST - อัปโหลดสลิปการโอนเงิน
export async function POST(request: Request) {
  try {
    console.log('Starting slip upload process...');
    
    // รับข้อมูลรูปภาพ
    const formData = await request.formData();
    const image = formData.get('slip') as File;
    const bookingId = formData.get('bookingId') as string;
    
    if (!image) {
      return NextResponse.json(
        { error: 'ກະລຸນາເລືອກສລິບການໂອນເງິນ' }, 
        { status: 400 }
      );
    }
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບເລກທີການຈອງ' }, 
        { status: 400 }
      );
    }
    
    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'ປະເພດໄຟລ์ບໍ່ຖືກຕ້ອງ (ຕ້ອງເປັນ JPG, PNG, ຫຼື WebP)' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: 'ຂະໜາດໄຟລ์ໃຫຍ່ເກີນໄປ (ບໍ່ເກີນ 5MB)' },
        { status: 400 }
      );
    }
    
    console.log('File validation passed:', {
      type: image.type,
      size: image.size,
      bookingId
    });
    
    // แปลงไฟล์เป็น Base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;
    
    console.log('Image converted to base64, uploading to Cloudinary...');
    
    // กำหนดโฟลเดอร์และชื่อไฟล์
    const folder = 'bus-ticket-system/payment-slips';
    const publicId = `slip_${bookingId}_${Date.now()}`;
    
    // อัปโหลดไปยัง Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder,
      public_id: publicId,
      transformation: [
        { width: 800, height: 1200, crop: "limit" }, // จำกัดขนาดสูงสุด
        { quality: "auto" }, // ปรับคุณภาพอัตโนมัติ
        { format: "auto" } // เลือกฟอร์แมตที่เหมาะสม
      ],
      // เพิ่ม context สำหรับการค้นหา
      context: {
        booking_id: bookingId,
        upload_type: 'payment_slip',
        uploaded_at: new Date().toISOString()
      }
    });
    
    console.log('Cloudinary upload successful:', {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
    
    // ส่งคืน URL ของรูปภาพ
    return NextResponse.json({ 
      success: true, 
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      message: 'ອັບໂຫລດສລິບສຳເລັດ'
    });
    
  } catch (error) {
    console.error('Upload slip error:', error);
    
    // จัดการ error ต่างๆ
    if (error instanceof Error) {
      // Cloudinary errors
      if (error.message.includes('Invalid image')) {
        return NextResponse.json(
          { error: 'ໄຟລ์ຮູບພາບບໍ່ຖືກຕ້ອງ' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('File size too large')) {
        return NextResponse.json(
          { error: 'ຂະໜາດໄຟລ์ໃຫຍ່ເກີນໄປ' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Network')) {
        return NextResponse.json(
          { error: 'ປັນຫາການເຊື່ອມຕໍ່ເຄືອຂ່າຍ ກະລຸນາລອງໃໝ່' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫລດສລິບ ກະລຸນາລອງໃໝ່',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}