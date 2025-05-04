// app/api/drivers/[id]/income-history/route.ts
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

    // Get last 30 days by default
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Get all days driver was checked in
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
    
    // Get settings
    const settings = await Settings.findOne();
    const revenueSharing = settings?.revenueSharing || { company: 10, station: 20, drivers: 70 };

    // Calculate income for each day
    const incomeHistory = await Promise.all(
      checkInDates.map(async (date) => {
        const dateObj = new Date(date);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get tickets for this date
        const tickets = await Ticket.find({
          createdAt: { $gte: dateObj, $lt: nextDay }
        });

        const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
        const driversShare = totalRevenue * (revenueSharing.drivers / 100);

        // Count drivers who worked that day
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

    // Sort by date descending
    incomeHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(incomeHistory);
  } catch (error) {
    console.error('Error fetching driver income history:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch driver income history' 
    }, { status: 500 });
  }
}