import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Driver from '@/models/Driver';
import Settings from '@/models/Settings';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์ - เฉพาะ admin เท่านั้นที่สามารถดูรายงานได้
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Only admin can access reports' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    await connectDB();
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get tickets
    const tickets = await Ticket.find({
      soldAt: { $gte: startDate, $lte: endDate }
    });

    // Get checked-in drivers
    const checkedInDrivers = await Driver.find({
      checkInStatus: 'checked-in',
      lastCheckIn: { $gte: startDate, $lte: endDate }
    });

    // Get settings for revenue sharing
    const settings = await Settings.findOne();
    
    // Calculate revenue
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    const revenueSharing = settings?.revenueSharing || { company: 10, station: 20, drivers: 70 };
    
    const companyShare = totalRevenue * (revenueSharing.company / 100);
    const stationShare = totalRevenue * (revenueSharing.station / 100);
    const driversShare = totalRevenue * (revenueSharing.drivers / 100);
    const perDriverIncome = checkedInDrivers.length > 0 ? driversShare / checkedInDrivers.length : 0;

    // Group tickets by hour
    const ticketsByHour = tickets.reduce((acc, ticket) => {
      const hour = new Date(ticket.soldAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      date,
      totalTickets: tickets.length,
      totalRevenue,
      revenueSharing: {
        company: companyShare,
        station: stationShare,
        drivers: driversShare,
        perDriver: perDriverIncome
      },
      driversWorking: checkedInDrivers.length,
      ticketsByHour,
      paymentMethods: {
        cash: tickets.filter(t => t.paymentMethod === 'cash').length,
        card: tickets.filter(t => t.paymentMethod === 'card').length,
        qr: tickets.filter(t => t.paymentMethod === 'qr').length
      }
    });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}