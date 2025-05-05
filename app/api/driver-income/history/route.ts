// app/api/driver-income/history/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';
import Ticket from '@/models/Ticket';
import Settings from '@/models/Settings';

const JWT_SECRET = process.env.JWT_SECRET || 'driver-secret-key';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ตรวจสอบ token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch  {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    await connectDB();
    
    // ตรวจสอบว่า driver มีตัวตนจริง
    const driver = await Driver.findById(decoded.id);
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // ดึงข้อมูลรายได้ย้อนหลัง 30 วัน
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // หาวันที่ driver เช็คอิน
    const driverCheckIns = await Driver.aggregate([
      {
        $match: {
          _id: driver._id,
          lastCheckIn: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$lastCheckIn" }
          }
        }
      }
    ]);

    const checkInDates = driverCheckIns.map(record => record.date);
    
    // ดึงข้อมูลการตั้งค่าการแบ่งรายได้
    const settings = await Settings.findOne();
    const revenueSharing = settings?.revenueSharing || { company: 10, station: 20, drivers: 70 };

    // คำนวณรายได้สำหรับแต่ละวัน
    const incomeHistory = await Promise.all(
      checkInDates.map(async (date) => {
        const dateObj = new Date(date);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);

        // หาตั๋วทั้งหมดในวันนั้น
        const tickets = await Ticket.find({
          createdAt: { $gte: dateObj, $lt: nextDay }
        });

        const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
        const driversShare = totalRevenue * (revenueSharing.drivers / 100);

        // นับจำนวนคนขับที่ทำงานในวันนั้น
        const checkedInDrivers = await Driver.countDocuments({
          lastCheckIn: { $gte: dateObj, $lt: nextDay }
        });

        const perDriverIncome = checkedInDrivers > 0 ? driversShare / checkedInDrivers : 0;

        return {
          date,
          income: perDriverIncome,
          totalRevenue,
          numberOfDrivers: checkedInDrivers,
          ticketsSold: tickets.length
        };
      })
    );

    // เรียงลำดับตามวันที่ ล่าสุดอยู่ข้างบน
    incomeHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(incomeHistory);
    
  } catch (error) {
    console.error('Error fetching driver income history:', error);
    return NextResponse.json({ error: 'Failed to fetch income data' }, { status: 500 });
  }
}