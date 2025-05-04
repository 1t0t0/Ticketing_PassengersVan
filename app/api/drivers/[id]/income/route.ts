// app/api/drivers/[id]/income/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';
import Ticket from '@/models/Ticket';
import Settings from '@/models/Settings';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const driver = await Driver.findById(params.id);
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get date from query params or use today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const queryDate = dateParam ? new Date(dateParam) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check if driver was checked in on this date
    const wasCheckedIn = await Driver.findOne({
      _id: params.id,
      lastCheckIn: { $gte: queryDate, $lt: nextDay }
    });

    if (!wasCheckedIn) {
      return NextResponse.json({
        date: queryDate.toISOString().split('T')[0],
        income: 0,
        totalRevenue: 0,
        driversShare: 0,
        numberOfDrivers: 0,
        ticketsSold: 0,
        message: 'Driver was not checked in on this date'
      });
    }

    // Get all tickets for the date
    const tickets = await Ticket.find({
      createdAt: { $gte: queryDate, $lt: nextDay }
    });

    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // Get settings for revenue sharing
    const settings = await Settings.findOne();
    const revenueSharing = settings?.revenueSharing || { company: 10, station: 20, drivers: 70 };

    // Calculate drivers' share
    const driversShare = totalRevenue * (revenueSharing.drivers / 100);

    // Count all drivers who were checked in on this date
    const checkedInDrivers = await Driver.countDocuments({
      lastCheckIn: { $gte: queryDate, $lt: nextDay }
    });

    const perDriverIncome = checkedInDrivers > 0 ? driversShare / checkedInDrivers : 0;

    return NextResponse.json({
      date: queryDate.toISOString().split('T')[0],
      income: perDriverIncome,
      totalRevenue,
      driversShare,
      numberOfDrivers: checkedInDrivers,
      ticketsSold: tickets.length
    });
  } catch (error) {
    console.error('Error fetching driver income:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch driver income' 
    }, { status: 500 });
  }
}