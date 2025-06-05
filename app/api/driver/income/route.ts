// app/api/driver/income/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - ดึงรายได้ของ Driver
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Only drivers can access this endpoint' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily'; // daily, monthly, summary
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const driverId = session.user.id;

    let result;

    switch (type) {
      case 'daily':
        result = await Income.getDriverDailyIncome(driverId, date);
        break;
        
      case 'monthly':
        result = await Income.getDriverMonthlyIncome(driverId, year, month);
        break;
        
      case 'summary':
        // รายงานสรุปย้อนหลัง 30 วัน
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const summaryData = await Income.aggregate([
          {
            $match: {
              driver_id: new Income.base.Types.ObjectId(driverId),
              revenue_share_type: 'driver',
              income_date: {
                $gte: thirtyDaysAgo,
                $lte: today
              }
            }
          },
          {
            $group: {
              _id: null,
              totalIncome: { $sum: '$income_amount' },
              totalTickets: { $sum: 1 },
              avgDailyIncome: { $avg: '$income_amount' },
              maxDailyIncome: { $max: '$income_amount' },
              minDailyIncome: { $min: '$income_amount' }
            }
          }
        ]);
        
        result = summaryData.length > 0 ? summaryData[0] : {
          totalIncome: 0,
          totalTickets: 0,
          avgDailyIncome: 0,
          maxDailyIncome: 0,
          minDailyIncome: 0
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      data: result
    });

  } catch (error) {
    console.error('Driver Income API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver income data' },
      { status: 500 }
    );
  }
}