// app/api/tickets/search/route.ts - ENHANCED DEBUG VERSION
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
    const ticketType = searchParams.get('ticketType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('🔍 Ticket search API called with params:', { 
      query, date, paymentMethod, ticketType, page, limit 
    });
    
    // ✅ DEBUG: ดูข้อมูลตั๋วในฐานข้อมูลจริง ๆ
    const totalTicketsInDB = await Ticket.countDocuments();
    console.log('📊 Total tickets in database:', totalTicketsInDB);
    
    // ✅ DEBUG: ดูตั๋วล่าสุด 5 รายการ
    const latestTickets = await Ticket.find()
      .sort({ soldAt: -1 })
      .limit(5)
      .select('ticketNumber soldAt soldBy price');
    
    console.log('🎫 Latest 5 tickets in DB:', latestTickets.map(t => ({
      ticketNumber: t.ticketNumber,
      soldAt: t.soldAt,
      soldAtISO: t.soldAt.toISOString(),
      soldAtDateOnly: t.soldAt.toISOString().split('T')[0],
      soldBy: t.soldBy,
      price: t.price
    })));
    
    // ✅ DEBUG: ดูช่วงวันที่ของตั๋วทั้งหมด
    const dateRange = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: '$soldAt' },
          maxDate: { $max: '$soldAt' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (dateRange.length > 0) {
      const range = dateRange[0];
      console.log('📅 Date range in database:', {
        minDate: range.minDate.toISOString(),
        maxDate: range.maxDate.toISOString(),
        minDateOnly: range.minDate.toISOString().split('T')[0],
        maxDateOnly: range.maxDate.toISOString().split('T')[0],
        totalTickets: range.count
      });
    }
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
    // สร้าง filter object
    const filter: any = {};
    
    // ถ้ามีการค้นหาด้วย query (ticketNumber หรือ soldBy)
    if (query && query.trim()) {
      filter['$or'] = [
        { ticketNumber: { $regex: query.trim(), $options: 'i' } },
        { soldBy: { $regex: query.trim(), $options: 'i' } }
      ];
      console.log('🔍 Added text search filter:', query.trim());
    }
    
    // ✅ ENHANCED: ถ้ามีการค้นหาด้วยวันที่
    if (date && date.trim()) {
      try {
        const dateString = date.trim();
        console.log('📅 Processing date filter:', dateString);
        
        // ✅ สร้างหลายรูปแบบเพื่อทดสอบ
        const selectedDate = new Date(dateString + 'T00:00:00.000Z');
        const nextDay = new Date(dateString + 'T23:59:59.999Z');
        
        // ตรวจสอบว่าวันที่ valid หรือไม่
        if (isNaN(selectedDate.getTime())) {
          console.error('❌ Invalid date format:', dateString);
          return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
        
        filter.soldAt = {
          $gte: selectedDate,
          $lte: nextDay
        };
        
        console.log('📅 Date filter created:', {
          inputDate: dateString,
          fromDate: selectedDate.toISOString(),
          toDate: nextDay.toISOString(),
          fromDateOnly: selectedDate.toISOString().split('T')[0],
          toDateOnly: nextDay.toISOString().split('T')[0]
        });
        
        // ✅ DEBUG: ทดสอบค้นหาด้วยวันที่นี้โดยตรง
        const testCount = await Ticket.countDocuments(filter);
        console.log('🧪 Test count with date filter:', testCount);
        
        // ✅ DEBUG: ดูตั๋วที่มีวันที่ใกล้เคียง
        const nearbyTickets = await Ticket.find({
          soldAt: {
            $gte: new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000), // 1 วันก่อน
            $lte: new Date(nextDay.getTime() + 24 * 60 * 60 * 1000)       // 1 วันหลัง
          }
        }).select('ticketNumber soldAt').sort({ soldAt: -1 }).limit(10);
        
        console.log('🔍 Tickets around selected date (±1 day):', nearbyTickets.map(t => ({
          ticketNumber: t.ticketNumber,
          soldAt: t.soldAt.toISOString(),
          dateOnly: t.soldAt.toISOString().split('T')[0]
        })));
        
      } catch (dateError) {
        console.error('❌ Date parsing error:', dateError);
        return NextResponse.json(
          { error: 'Date parsing failed: ' + (dateError as Error).message },
          { status: 400 }
        );
      }
    } else {
      // ✅ ENHANCED: ถ้าไม่ระบุวันที่ ให้ดูตั๋วทั้งหมด (สำหรับ debug)
      console.log('⚠️ No date filter provided - showing all tickets for debug');
      // ไม่ใส่ filter วันที่เพื่อดูข้อมูลทั้งหมด
    }
    
    // ถ้ามีการกรองด้วยวิธีการชำระเงิน
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
      console.log('💳 Added payment method filter:', paymentMethod);
    }
    
    // ถ้ามีการกรองด้วยประเภทตั๋ว
    if (ticketType && (ticketType === 'individual' || ticketType === 'group')) {
      filter.ticketType = ticketType;
      console.log('🎫 Added ticket type filter:', ticketType);
    }
    
    console.log('🔍 Final MongoDB filter:', JSON.stringify(filter, null, 2));
    
    // นับจำนวนตั๋วทั้งหมดที่ตรงกับเงื่อนไข
    const totalItems = await Ticket.countDocuments(filter);
    console.log('📊 Total items matching filter:', totalItems);
    
    // ✅ DEBUG: ถ้าไม่มีข้อมูล ให้ดูข้อมูลแบบอื่น
    if (totalItems === 0 && date) {
      console.log('🔍 No tickets found with date filter, checking alternatives...');
      
      // ทดสอบโดยไม่ใส่เวลา
      const dateOnlyFilter = {
        ...filter,
        soldAt: {
          $regex: new RegExp(date.trim())
        }
      };
      delete dateOnlyFilter.soldAt; // ลบ filter เวลาออก
      
      // เพิ่ม filter วันที่แบบ string matching
      const dateStr = date.trim();
      const alternativeFilter = {
        ...filter,
        $expr: {
          $eq: [
            { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } },
            dateStr
          ]
        }
      };
      
      const altCount = await Ticket.countDocuments(alternativeFilter);
      console.log('🧪 Alternative date filter count:', altCount);
      
      if (altCount > 0) {
        console.log('✅ Found tickets with alternative date matching!');
        // ใช้ alternative filter แทน
        Object.assign(filter, alternativeFilter);
      }
    }
    
    // คำนวณหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไขและการแบ่งหน้า
    const tickets = await Ticket.find(filter)
      .populate('assignedDriverId', 'name employeeId checkInStatus')
      .sort({ soldAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`✅ Retrieved ${tickets.length} tickets out of ${totalItems} total for page ${page}`);
    
    // เพิ่มสถิติแยกตามประเภทตั๋ว
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
    
    // ส่งข้อมูล pagination กลับไปด้วย
    const response = {
      tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      },
      statistics: statsFormatted,
      debug: {
        totalTicketsInDB,
        latestTickets: latestTickets.map(t => ({
          ticketNumber: t.ticketNumber,
          soldAt: t.soldAt.toISOString(),
          dateOnly: t.soldAt.toISOString().split('T')[0]
        })),
        dateRange: dateRange[0] || null,
        filterUsed: filter,
        searchParams: { query, date, paymentMethod, ticketType, page, limit },
        resultCount: tickets.length,
        totalMatching: totalItems
      }
    };
    
    console.log(`✅ API Response: ${tickets.length} tickets, page ${page}/${totalPages}, total ${totalItems}`);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Ticket Search Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}