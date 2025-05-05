// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Driver from '@/models/Driver';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day'; // day, month, year
    
    // กำหนดช่วงเวลาสำหรับค้นหา
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'day':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { soldAt: { $gte: startOfDay } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { soldAt: { $gte: startOfMonth } };
        break;
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFilter = { soldAt: { $gte: startOfYear } };
        break;
      default:
        const startOfDayDefault = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { soldAt: { $gte: startOfDayDefault } };
    }

    // นับจำนวนตั๋วและคำนวณรายได้ตามช่วงเวลา
    const totalTicketsSold = await Ticket.countDocuments(dateFilter);
    const totalRevenueResult = await Ticket.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // นับจำนวน Drivers ทั้งหมด (ไม่ว่าจะ active หรือไม่)
    const totalDrivers = await Driver.countDocuments({});

    // นับ Checked-in Drivers
    const checkedInDrivers = await Driver.countDocuments({ checkInStatus: 'checked-in' });

    // ข้อมูลสำหรับกราฟรายวัน (7 วันล่าสุด) - ยังคงมีไว้สำหรับหน้า Dashboard
    const dailyTickets = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$soldAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$price" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ข้อมูลสำหรับกราฟรายชั่วโมง (วันนี้) - ยังคงมีไว้สำหรับหน้า Dashboard
    const hourlyTickets = await Ticket.aggregate([
      {
        $match: {
          soldAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
        }
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

    return NextResponse.json({
      totalTicketsSold,
      totalRevenue,
      totalDrivers, // Changed from activeDrivers to totalDrivers
      checkedInDrivers,
      dailyTickets,
      hourlyTickets
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats' 
    }, { status: 500 });
  }
}