// app/api/bookings/[id]/upload-slip/route.ts - API สำหรับอัปโหลดสลิปการโอนเงิน
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import cloudinary from '@/lib/cloudinary';

// POST - อัปโหลดสลิปการโอนเงิน
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    console.log(`📤 Uploading payment slip for booking: ${params.id}`);
    
    // หาการจอง
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจองนี้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสถานะการจอง
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'ไม่สามารถอัปโหลดสลิปได้ เนื่องจากการจองไม่อยู่ในสถานะรอดำเนินการ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าหมดอายุหรือไม่
    if (booking.isExpired()) {
      return NextResponse.json(
        { error: 'การจองนี้หมดอายุแล้ว' },
        { status: 400 }
      );
    }
    
    // รับไฟล์รูปภาพจาก form data
    const formData = await request.formData();
    const image = formData.get('payment_slip') as File;
    const booker_email = formData.get('booker_email') as string;
    
    if (!image) {
      return NextResponse.json(
        { error: 'กรุณาเลือกไฟล์รูปภาพสลิปการโอนเงิน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบ email ผู้จอง (เพื่อความปลอดภัย)
    if (booker_email && booker_email.toLowerCase().trim() !== booking.booker_email) {
      return NextResponse.json(
        { error: 'Email ผู้จองไม่ตรงกับข้อมูลในระบบ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบขนาดไฟล์ (สูงสุด 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' },
        { status: 400 }
      );
    }
    
    console.log(`📷 Processing image: ${image.name}, size: ${(image.size / 1024 / 1024).toFixed(2)}MB`);
    
    try {
      // แปลงไฟล์เป็น Base64
      const buffer = Buffer.from(await image.arrayBuffer());
      const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;
      
      // อัปโหลดไปยัง Cloudinary
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: 'bus-ticket-system/payment-slips',
        public_id: `booking-${booking.booking_id}-${Date.now()}`,
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" }
        ],
        resource_type: "auto"
      });
      
      console.log('☁️ Image uploaded to Cloudinary:', uploadResult.public_id);
      
      // อัปเดตการจองด้วย URL ของสลิป
      const updatedBooking = await Booking.findByIdAndUpdate(
        params.id,
        { 
          $set: { 
            payment_slip: uploadResult.secure_url,
            updated_at: new Date()
          }
        },
        { new: true }
      );
      
      if (!updatedBooking) {
        // ถ้าอัปเดตไม่สำเร็จ ให้ลบรูปออกจาก Cloudinary
        await cloudinary.uploader.destroy(uploadResult.public_id);
        throw new Error('ไม่สามารถอัปเดตข้อมูลการจองได้');
      }
      
      console.log(`✅ Payment slip uploaded for booking: ${booking.booking_id}`);
      
      // TODO: ส่ง Email แจ้งยืนยันการอัปโหลดสลิป (Phase 4)
      
      return NextResponse.json({
        success: true,
        message: 'อัปโหลดสลิปการโอนเงินสำเร็จ',
        booking: {
          id: updatedBooking._id,
          booking_id: updatedBooking.booking_id,
          payment_slip: updatedBooking.payment_slip,
          status: updatedBooking.status,
          expires_at: updatedBooking.expires_at,
          time_remaining: updatedBooking.getTimeRemaining(),
          can_approve: updatedBooking.canApprove()
        },
        cloudinary_info: {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes
        },
        next_steps: {
          message: 'รอการตรวจสอบจาก Admin ภายใน 24 ชั่วโมง',
          status_check_url: `/booking/status/${updatedBooking._id}`,
          admin_review: 'สลิปการโอนเงินจะได้รับการตรวจสอบโดยทีมงาน'
        }
      });
      
    } catch (cloudinaryError) {
      console.error('☁️ Cloudinary upload error:', cloudinaryError);
      
      return NextResponse.json(
        { 
          error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
          details: 'กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('💥 Upload payment slip error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - ดูสลิปการโอนเงิน
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    console.log(`🔍 Viewing payment slip for booking: ${params.id}`);
    
    // หาการจอง
    const booking = await Booking.findById(params.id).select('booking_id payment_slip booker_email status');
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจองนี้' },
        { status: 404 }
      );
    }
    
    if (!booking.payment_slip) {
      return NextResponse.json(
        { error: 'ยังไม่มีการอัปโหลดสลิปการโอนเงิน' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์การเข้าถึง (สำหรับความปลอดภัย)
    const { searchParams } = new URL(request.url);
    const publicView = searchParams.get('public') === 'true';
    
    if (publicView) {
      // สำหรับหน้าเช็คสถานะ - แสดงเฉพาะข้อมูลพื้นฐาน
      return NextResponse.json({
        success: true,
        booking_id: booking.booking_id,
        has_payment_slip: !!booking.payment_slip,
        status: booking.status,
        payment_slip_url: booking.payment_slip // อาจจะต้องการ token-based access
      });
    }
    
    // สำหรับ Admin/Staff - แสดงข้อมูลเต็ม
    return NextResponse.json({
      success: true,
      booking: {
        id: booking._id,
        booking_id: booking.booking_id,
        booker_email: booking.booker_email,
        status: booking.status,
        payment_slip: booking.payment_slip
      }
    });
    
  } catch (error) {
    console.error('💥 Get payment slip error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดูสลิป',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - ลบสลิปการโอนเงิน (กรณีต้องการอัปโหลดใหม่)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    console.log(`🗑️ Deleting payment slip for booking: ${params.id}`);
    
    // หาการจอง
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจองนี้' },
        { status: 404 }
      );
    }
    
    // ตรวจสอบสิทธิ์ - เฉพาะ pending เท่านั้น
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบสลิปได้ เนื่องจากการจองไม่อยู่ในสถานะรอดำเนินการ' },
        { status: 400 }
      );
    }
    
    if (!booking.payment_slip) {
      return NextResponse.json(
        { error: 'ไม่มีสลิปการโอนเงินให้ลบ' },
        { status: 404 }
      );
    }
    
    try {
      // ดึง public_id จาก URL ของ Cloudinary
      const urlParts = booking.payment_slip.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = `bus-ticket-system/payment-slips/${publicIdWithExt.split('.')[0]}`;
      
      // ลบรูปจาก Cloudinary
      await cloudinary.uploader.destroy(publicId);
      console.log('☁️ Deleted image from Cloudinary:', publicId);
      
    } catch (cloudinaryError) {
      console.warn('⚠️ Failed to delete from Cloudinary:', cloudinaryError);
      // ไม่ให้ error นี้หยุดการลบใน database
    }
    
    // ลบ URL ออกจากฐานข้อมูล
    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      { 
        $unset: { payment_slip: 1 },
        $set: { updated_at: new Date() }
      },
      { new: true }
    );
    
    console.log(`✅ Payment slip deleted for booking: ${booking.booking_id}`);
    
    return NextResponse.json({
      success: true,
      message: 'ลบสลิปการโอนเงินสำเร็จ',
      booking: {
        id: updatedBooking._id,
        booking_id: updatedBooking.booking_id,
        payment_slip: null,
        status: updatedBooking.status,
        can_upload_again: true
      }
    });
    
  } catch (error) {
    console.error('💥 Delete payment slip error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการลบสลิป',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}