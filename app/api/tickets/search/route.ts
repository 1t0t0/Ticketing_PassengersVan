// app/api/tickets/search/route.ts - Enhanced with Ticket Type filtering
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function GET(request: Request) {
  try {
    // เชื่อมต่อ Database
    await connectDB();
    
    // รับ parameters จาก URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const date = searchParams.get('date');
    const paymentMethod = searchParams.get('paymentMethod');
    const ticketType = searchParams.get('ticketType'); // ✅ เพิ่มการกรองตามประเภทตั๋ว
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('Ticket search params:', { 
      query, date, paymentMethod, ticketType, page, limit 
    });
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
    // สร้าง filter object
    const filter: any = {};
    
    // ถ้ามีการค้นหาด้วย query (ticketNumber หรือ soldBy)
    if (query) {
      filter['$or'] = [
        { ticketNumber: { $regex: query, $options: 'i' } },
        { soldBy: { $regex: query, $options: 'i' } }
      ];
    }
    
    // ถ้ามีการค้นหาด้วยวันที่
    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      
      filter.soldAt = {
        $gte: selectedDate,
        $lt: nextDay
      };
    }
    
    // ถ้ามีการกรองด้วยวิธีการชำระเงิน
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    // ✅ ถ้ามีการกรองด้วยประเภทตั๋ว
    if (ticketType && (ticketType === 'individual' || ticketType === 'group')) {
      filter.ticketType = ticketType;
      console.log(`Filtering by ticket type: ${ticketType}`);
    }
    
    console.log('MongoDB filter:', JSON.stringify(filter, null, 2));
    
    // นับจำนวนตั๋วทั้งหมดที่ตรงกับเงื่อนไข
    const totalItems = await Ticket.countDocuments(filter);
    
    // คำนวณหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไขและการแบ่งหน้า
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 }) // เรียงจากล่าสุด
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${tickets.length} tickets out of ${totalItems} total`);
    
    // ✅ เพิ่มสถิติแยกตามประเภทตั๋ว
    const statistics = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$ticketType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          totalPassengers: { $sum: { $ifNull: ['$passengerCount', 1] } }
        }
      }
    ]);
    
    const statsFormatted = {
      individual: { count: 0, totalRevenue: 0, totalPassengers: 0 },
      group: { count: 0, totalRevenue: 0, totalPassengers: 0 }
    };
    
    statistics.forEach(stat => {
      if (stat._id === 'individual' || stat._id === 'group') {
        statsFormatted[stat._id] = {
          count: stat.count,
          totalRevenue: stat.totalRevenue,
          totalPassengers: stat.totalPassengers
        };
      }
    });
    
    console.log('Statistics:', statsFormatted);
    
    // ส่งข้อมูล pagination กลับไปด้วย
    return NextResponse.json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      },
      statistics: statsFormatted // ✅ เพิ่มสถิติ
    });
  } catch (error) {
    console.error('Ticket Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to search tickets' }, 
      { status: 500 }
    );
  }
}