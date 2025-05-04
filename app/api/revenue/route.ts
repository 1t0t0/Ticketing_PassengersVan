import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Driver from '@/models/Driver';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Get today's date or use the provided date
    const queryDate = dateParam ? new Date(dateParam) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all tickets for the specified date
    const tickets = await Ticket.find({
      createdAt: { $gte: queryDate, $lt: nextDay }
    });

    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // Calculate revenue shares
    const parentCompanyShare = totalRevenue * 0.1;
    const stationShare = totalRevenue * 0.2;
    const driversShare = totalRevenue * 0.7;

    // Get number of checked-in drivers for that day
    const checkedInDrivers = await Driver.countDocuments({
      checkInStatus: 'checked-in',
      lastCheckIn: { $gte: queryDate, $lt: nextDay }
    });

    const numberOfDrivers = checkedInDrivers || 1; // Prevent division by zero
    const perDriverIncome = driversShare / numberOfDrivers;

    return NextResponse.json({
      totalRevenue,
      parentCompanyShare,
      stationShare,
      driversShare,
      numberOfDrivers,
      perDriverIncome,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}