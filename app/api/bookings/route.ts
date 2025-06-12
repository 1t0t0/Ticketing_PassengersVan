// app/api/bookings/route.ts - Fixed API เพื่อแสดงข้อมูลได้
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงรายการการจองทั้งหมด (สำหรับ Admin/Staff)
export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin และ staff)
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'ບໍ່ມີສິດທິ່ເຂົ້າເບິ່ງຂໍ້ມູນການຈອງ' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    
    // สร้าง filter
    const filter: any = {};
    
    // 🔧 แก้ไข: ใช้ status filter ถูกต้อง
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // 🔧 แก้ไข: เพิ่ม search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      filter.$or = [
        { bookingNumber: { $regex: searchTerm, $options: 'i' } },
        { 'passengerInfo.name': { $regex: searchTerm, $options: 'i' } },
        { 'passengerInfo.phone': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // คำนวณ pagination
    const skip = (page - 1) * limit;
    
    console.log('🔍 Bookings API filter:', filter, 'Page:', page, 'Limit:', limit);
    
    // ดึงข้อมูลการจอง
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('approvedBy', 'name email employeeId')
      .lean(); // เพิ่ม lean() เพื่อประสิทธิภาพ
    
    // นับจำนวนทั้งหมด
    const totalCount = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`✅ Found ${bookings.length} bookings from ${totalCount} total`);
    
    // 🔧 แก้ไข: อัปเดตสถานะการหมดอายุอัตโนมัติ
    const now = new Date();
    const expiredCount = await Booking.updateMany(
      { 
        status: 'pending', 
        expiresAt: { $lt: now } 
      },
      { 
        $set: { status: 'expired' } 
      }
    );
    
    if (expiredCount.modifiedCount > 0) {
      console.log(`⏰ Updated ${expiredCount.modifiedCount} expired bookings`);
      
      // ถ้ามีการอัปเดต ให้ดึงข้อมูลใหม่
      const updatedBookings = await Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('approvedBy', 'name email employeeId')
        .lean();
        
      const updatedTotalCount = await Booking.countDocuments(filter);
      
      return NextResponse.json({
        bookings: updatedBookings.map(booking => ({
          ...booking,
          statusLao: getStatusLao(booking.status)
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(updatedTotalCount / limit),
          totalCount: updatedTotalCount,
          limit
        }
      });
    }
    
    return NextResponse.json({
      bookings: bookings.map(booking => ({
        ...booking,
        statusLao: getStatusLao(booking.status)
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit
      }
    });
    
  } catch (error) {
    console.error('❌ Get Bookings Error:', error);
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນການຈອງ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 🔧 เพิ่ม helper function สำหรับแปลงสถานะ
function getStatusLao(status: string): string {
  const statusMap = {
    'pending': 'ລໍຖ້າການອະນຸມັດ',
    'approved': 'ອະນຸມັດແລ້ວ',
    'rejected': 'ປະຕິເສດ',
    'expired': 'ໝົດອາຍຸ'
  };
  return statusMap[status as keyof typeof statusMap] || status;
}

// POST - สร้างการจองใหม่ (สำหรับ Public) - เหมือนเดิม
export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Creating new booking with data:', body);
    
    const { passengerInfo, tripDetails, basePrice } = body;
    
    // ตรวจสอบข้อมูลที่จำเป็น (เฉพาะที่ frontend ส่งมา)
    if (!passengerInfo?.name || !passengerInfo?.phone || !tripDetails?.travelDate || !tripDetails?.passengers || !basePrice) {
      return NextResponse.json(
        { error: 'ຂາດຂໍ້ມູນທີ່ຈຳເປັນ: ຊື່, ເບີໂທ, ວັນທີເດີນທາງ, ຈຳນວນຄົນ, ລາຄາ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบจำนวนผู้โดยสาร
    const passengers = parseInt(tripDetails.passengers);
    if (passengers < 1 || passengers > 10) {
      return NextResponse.json(
        { error: 'ຈຳນວນຜູ້ໂດຍສານຕ້ອງເປັນ 1-10 ຄົນ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบวันที่เดินทาง (ต้องเป็นวันพรุ่งนี้เป็นต้นไป)
    const travelDate = new Date(tripDetails.travelDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (travelDate < tomorrow) {
      return NextResponse.json(
        { error: 'ວັນທີເດີນທາງຕ້ອງເປັນມື້ພຸ່ງນີ້ເປັນຕົ້ນໄປ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบเบอร์โทรที่ซ้ำกันในวันเดียวกัน
    const existingBooking = await Booking.findOne({
      'passengerInfo.phone': passengerInfo.phone.trim(),
      'tripDetails.travelDate': {
        $gte: new Date(travelDate.getFullYear(), travelDate.getMonth(), travelDate.getDate()),
        $lt: new Date(travelDate.getFullYear(), travelDate.getMonth(), travelDate.getDate() + 1)
      },
      status: { $in: ['pending', 'approved'] }
    });
    
    if (existingBooking) {
      return NextResponse.json(
        { error: 'ເບີໂທນີ້ມີການຈອງໃນວັນດຽວກັນແລ້ວ' },
        { status: 409 }
      );
    }
    
    // คำนวณราคารวม
    const totalAmount = basePrice * passengers;
    
    // เตรียมข้อมูลการจอง (เฉพาะที่ frontend ส่งมา)
    const bookingData = {
      passengerInfo: {
        name: passengerInfo.name.trim(),
        phone: passengerInfo.phone.trim(),
        email: passengerInfo.email?.trim() || undefined
      },
      tripDetails: {
        pickupLocation: 'ຈຸດນັດພົບ', // ค่าคงที่
        destination: 'ຕົວເມືອງ', // ค่าคงที่  
        travelDate: travelDate,
        travelTime: '08:00', // ค่าคงที่
        passengers: passengers
      },
      pricing: {
        basePrice: basePrice,
        totalAmount: totalAmount
      }
    };
    
    // สร้างการจอง
    const booking = await Booking.createBooking(bookingData);
    
    console.log('Booking created successfully:', booking.bookingNumber);
    
    return NextResponse.json({
      success: true,
      booking: booking,
      message: 'ສ້າງການຈອງສຳເລັດ'
    });
    
  } catch (error) {
    console.error('Create Booking Error:', error);
    
    // จัดการ error เฉพาะ
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງເລກທີການຈອງ ກະລຸນາລອງໃໝ່' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງການຈອງ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}