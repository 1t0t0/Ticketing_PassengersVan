// app/api/revenue/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// สัดส่วนการแบ่งรายได้
const REVENUE_SHARE = {
  COMPANY: 0.10,    // 10%
  STATION: 0.20,    // 20%
  DRIVERS: 0.70     // 70%
};

export async function GET(request: Request) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly
    
    console.log('Revenue API request:', { startDate, endDate, period });
    
    // กำหนดช่วงวันที่
    let dateFilter: any = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        soldAt: {
          $gte: new Date(startDate + 'T00:00:00.000Z'),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    } else if (startDate) {
      dateFilter = {
        soldAt: {
          $gte: new Date(startDate + 'T00:00:00.000Z'),
          $lte: new Date(startDate + 'T23:59:59.999Z')
        }
      };
    } else {
      // ค่าเริ่มต้น: วันนี้
      const today = new Date();
      dateFilter = {
        soldAt: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          $lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        }
      };
    }

    console.log('Date filter:', dateFilter);

    // ดึงข้อมูลตั๋วทั้งหมดในช่วงวันที่ที่กำหนด
    const tickets = await Ticket.find(dateFilter);
    console.log('Found tickets:', tickets.length);
    
    // คำนวณรายได้รวม
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    const totalTickets = tickets.length;
    
    // คำนวณการแบ่งรายได้
    const companyShare = Math.round(totalRevenue * REVENUE_SHARE.COMPANY);
    const stationShare = Math.round(totalRevenue * REVENUE_SHARE.STATION);
    const driversShare = Math.round(totalRevenue * REVENUE_SHARE.DRIVERS);
    
    // สร้างข้อมูลสำหรับกราฟรายวัน (ถ้าเป็น period daily)
    let dailyData = [];
    if (period === 'daily') {
      // จัดกลุ่มตั๋วตามวันที่
      const ticketsByDate = tickets.reduce((acc, ticket) => {
        const date = new Date(ticket.soldAt).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(ticket);
        return acc;
      }, {} as Record<string, any[]>);
      
      // แปลงเป็นข้อมูลสำหรับกราฟ
      dailyData = Object.entries(ticketsByDate).map(([date, dayTickets]) => {
        const dayRevenue = dayTickets.reduce((sum, ticket) => sum + ticket.price, 0);
        return {
          date,
          totalRevenue: dayRevenue,
          totalTickets: dayTickets.length,
          companyShare: Math.round(dayRevenue * REVENUE_SHARE.COMPANY),
          stationShare: Math.round(dayRevenue * REVENUE_SHARE.STATION),
          driversShare: Math.round(dayRevenue * REVENUE_SHARE.DRIVERS)
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // คำนวณข้อมูลตามวิธีการชำระเงิน
    const paymentMethodBreakdown = tickets.reduce((acc, ticket) => {
      const method = ticket.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 };
      }
      acc[method].count += 1;
      acc[method].revenue += ticket.price;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);
    
    const result = {
      summary: {
        totalTickets,
        totalRevenue,
        averageTicketPrice: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
        revenueShare: {
          company: companyShare,
          station: stationShare,
          drivers: driversShare
        },
        sharePercentages: {
          company: REVENUE_SHARE.COMPANY * 100,
          station: REVENUE_SHARE.STATION * 100,
          drivers: REVENUE_SHARE.DRIVERS * 100
        }
      },
      dailyData,
      paymentMethodBreakdown,
      dateRange: {
        start: dateFilter.soldAt?.$gte || null,
        end: dateFilter.soldAt?.$lte || null
      }
    };
    
    console.log('Revenue calculation result:', {
      totalTickets: result.summary.totalTickets,
      totalRevenue: result.summary.totalRevenue,
      companyShare,
      stationShare,
      driversShare
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Revenue API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch revenue data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}