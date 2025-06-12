// app/api/bookings/status/route.ts - API สำหรับตรวจสอบสถานะการจอง
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

// GET - ค้นหาการจองด้วยเลขการจองหรือเบอร์โทร
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'กรุณาใส่เลขที่การจองหรือเบอร์โทร' },
        { status: 400 }
      );
    }
    
    const searchTerm = query.trim();
    console.log('Searching for booking with query:', searchTerm);
    
    // สร้าง search conditions
    const searchConditions = [];
    
    // ค้นหาด้วยเลขการจอง (exact match)
    searchConditions.push({ bookingNumber: searchTerm });
    
    // ค้นหาด้วยเบอร์โทร (รองรับหลายรูปแบบ)
    const phoneVariations = [
      searchTerm,
      searchTerm.replace(/\s+/g, ''), // ลบช่องว่าง
      searchTerm.replace(/[^\d]/g, ''), // เอาเฉพาะตัวเลข
    ];
    
    phoneVariations.forEach(phone => {
      if (phone) {
        searchConditions.push({ 'passengerInfo.phone': phone });
        searchConditions.push({ 'passengerInfo.phone': { $regex: phone, $options: 'i' } });
      }
    });
    
    // ค้นหาด้วยชื่อ (partial match)
    searchConditions.push({ 
      'passengerInfo.name': { $regex: searchTerm, $options: 'i' } 
    });
    
    console.log('Search conditions:', searchConditions);
    
    // ดำเนินการค้นหา
    const bookings = await Booking.find({
      $or: searchConditions
    }).sort({ createdAt: -1 }).limit(10); // จำกัด 10 รายการล่าสุด
    
    console.log('Found bookings:', bookings.length);
    
    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'ບໍ່ພົບຂໍ້ມູນການຈອງ' },
        { status: 404 }
      );
    }
    
    // ถ้าค้นหาด้วยเลขการจองและพบ 1 รายการ ให้ส่งกลับเป็น object
    if (bookings.length === 1 && bookings[0].bookingNumber === searchTerm) {
      return NextResponse.json(bookings[0]);
    }
    
    // ส่งกลับเป็น array
    return NextResponse.json(bookings);
    
  } catch (error) {
    console.error('Booking Status Search Error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}