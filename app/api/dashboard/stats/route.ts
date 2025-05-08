// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // รับพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // กำหนดช่วงเวลาสำหรับค้นหา
    const now = new Date();
    
    let startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(now.getFullYear(), now.getMonth(), now.getDate()); // เริ่มต้นวันนี้
    
    let endDate = endDateParam
      ? new Date(endDateParam + 'T23:59:59.999Z')  // สิ้นสุดวันที่เลือกเวลา 23:59:59
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // สิ้นสุดวันนี้
    
    const dateFilter = { 
      soldAt: { 
        $gte: startDate, 
        $lte: endDate 
      } 
    };

    // นับจำนวนตั๋วและคำนวณรายได้ตามช่วงเวลา
    const totalTicketsSold = await Ticket.countDocuments(dateFilter);
    const totalRevenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // นับจำนวน Drivers ทั้งหมด (ในที่นี้ให้ค่าคงที่ เพราะอาจจะต้องดึงจากโมเดลอื่น)
    const totalDrivers = 124; // สมมติค่า

    // นับ Checked-in Drivers (ในที่นี้ให้ค่าคงที่ เพราะอาจจะต้องดึงจากโมเดลอื่น)
    const checkedInDrivers = 87; // สมมติค่า

    // ข้อมูลสำหรับกราฟรายชั่วโมง (วันนี้)
    const hourlyTickets = await Ticket.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: { $hour: "$soldAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // คำนวณสถิติการชำระเงิน
    const paymentMethodStats = await Ticket.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 }
        }
      }
    ]);

    // แปลงผลลัพธ์เป็นรูปแบบที่ใช้งานง่าย
    let cashCount = 0;
    let qrCount = 0;

    paymentMethodStats.forEach(stat => {
      if (stat._id === 'cash') {
        cashCount = stat.count;
      } else if (stat._id === 'qr') {
        qrCount = stat.count;
      }
    });

    const totalPayments = cashCount + qrCount;
    const cashPercentage = totalPayments > 0 ? Math.round((cashCount / totalPayments) * 100) : 65; // default 65% if no data
    const qrPercentage = totalPayments > 0 ? Math.round((qrCount / totalPayments) * 100) : 35; // default 35% if no data

    return NextResponse.json({
      totalTicketsSold,
      totalRevenue,
      totalDrivers,
      checkedInDrivers,
      hourlyTickets,
      paymentMethodStats: {
        cash: cashPercentage,
        qr: qrPercentage
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats' 
    }, { status: 500 });
  }
}