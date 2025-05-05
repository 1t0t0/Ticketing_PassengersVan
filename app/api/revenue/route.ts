// app/api/revenue/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Driver from '@/models/Driver';
import Settings from '@/models/Settings';

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
      soldAt: { $gte: queryDate, $lt: nextDay }
    });

    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // Get revenue sharing settings
    const settings = await Settings.findOne();
    const revenueSharing = settings?.revenueSharing || { company: 10, station: 20, drivers: 70 };
    
    // Calculate revenue shares
    const parentCompanyShare = totalRevenue * (revenueSharing.company / 100);
    const stationShare = totalRevenue * (revenueSharing.station / 100);
    const driversShare = totalRevenue * (revenueSharing.drivers / 100);

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
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch revenue data' 
    }, { status: 500 });
  }
}