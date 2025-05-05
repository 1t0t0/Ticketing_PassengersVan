// app/api/revenue/trends/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly
    const days = parseInt(searchParams.get('days') || '30'); // จำนวนวันย้อนหลัง
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let groupByFormat;
    let sortField;
    
    switch(period) {
      case 'weekly':
        groupByFormat = { $week: "$soldAt" };
        sortField = "week";
        break;
      case 'monthly':
        groupByFormat = { $month: "$soldAt" };
        sortField = "month";
        break;
      case 'daily':
      default:
        groupByFormat = { $dateToString: { format: "%Y-%m-%d", date: "$soldAt" } };
        sortField = "date";
    }
    
    const pipeline = [
      {
        $match: {
          soldAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupByFormat,
          count: { $sum: 1 },
          revenue: { $sum: "$price" },
          date: { $first: "$soldAt" }
        }
      },
      { $sort: { date: 1 } }
    ];
    
    const trends = await Ticket.aggregate(pipeline);
    
    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue trends' }, { status: 500 });
  }
}