import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Driver from '@/models/Driver';

export async function GET() {
  try {
    await connectDB();
    
    // นับจำนวนตั๋วทั้งหมด
    const totalTicketsSold = await Ticket.countDocuments();

    // คำนวณรายได้ทั้งหมด
    const totalRevenueResult = await Ticket.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // นับ Active Drivers
    const activeDrivers = await Driver.countDocuments({ status: 'active' });

    // นับ Checked-in Drivers
    const checkedInDrivers = await Driver.countDocuments({ checkInStatus: 'checked-in' });

    return NextResponse.json({
      totalTicketsSold,
      totalRevenue,
      activeDrivers,
      checkedInDrivers,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard stats' 
    }, { status: 500 });
  }
}