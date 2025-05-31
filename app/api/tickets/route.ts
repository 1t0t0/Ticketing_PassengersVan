// app/api/tickets/route.ts - Enhanced with driver revenue tracking
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Income from '@/models/Income';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    // ตรวจสอบ session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // เชื่อมต่อ Database
    await connectDB();

    // ตรวจสอบ Request Body
    const body = await request.json();
    const { price, paymentMethod } = body;

    console.log('Creating ticket with revenue tracking:', { 
      price, 
      paymentMethod, 
      soldBy: session.user.email 
    });

    // Validate ข้อมูล
    if (!price || !paymentMethod) {
      return NextResponse.json(
        { error: 'Price and Payment Method are required' }, 
        { status: 400 }
      );
    }

    // สร้าง Ticket Number
    const ticketNumber = `T${Date.now()}`;
    const currentTime = new Date();
    const soldBy = session.user.email || session.user.name || 'System';

    console.log('Generated ticket number:', ticketNumber);
    console.log('Current time:', currentTime);

    // สร้าง Ticket
    const ticketData = {
      ticketNumber,
      price,
      paymentMethod,
      soldBy,
      soldAt: currentTime
    };

    console.log('Creating ticket with full data:', ticketData);

    const ticket = await Ticket.create(ticketData);

    console.log('Ticket created successfully:', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      soldAt: ticket.soldAt,
      price: ticket.price
    });

    // ** ส่วนใหม่: สร้าง Income records และเชื่อมโยงกับคนขับที่เข้าทำงาน **
    try {
      console.log('Creating income records with working drivers...');
      
      const incomeRecords = await Income.createFromTicketWithWorkingDrivers(
        ticket._id.toString(),
        ticket.price,
        soldBy,
        session.user.stationId // ถ้ามี station ID
      );
      
      console.log(`Income records created: ${incomeRecords.length} records`);
      
      // ตรวจสอบว่ามีคนขับที่เข้าทำงานหรือไม่
      const driverIncomes = incomeRecords.filter(income => income.revenue_share_type === 'driver');
      
      if (driverIncomes.length === 0) {
        console.warn('No working drivers found! Revenue will not be distributed to drivers.');
      } else {
        console.log(`Revenue will be distributed to ${driverIncomes.length} working drivers`);
      }
      
      // เพิ่มข้อมูล income ลงใน response
      const ticketWithIncome = {
        ...ticket.toObject(),
        incomeRecords: incomeRecords.map(income => ({
          income_id: income.income_id,
          revenue_share_type: income.revenue_share_type,
          income_amount: income.income_amount,
          driver_id: income.driver_id,
          working_drivers_count: income.working_drivers_count,
          individual_driver_share: income.individual_driver_share
        }))
      };
      
      return NextResponse.json(ticketWithIncome);
      
    } catch (incomeError) {
      console.error('Failed to create income records:', incomeError);
      
      // ถึงแม้ว่าการสร้าง income จะล้มเหลว แต่ ticket ยังสร้างสำเร็จ
      // ส่งคืน ticket พร้อมแจ้ง warning
      return NextResponse.json({
        ...ticket.toObject(),
        warning: 'Ticket created but income tracking failed',
        incomeError: incomeError instanceof Error ? incomeError.message : 'Unknown income error'
      });
    }

  } catch (error) {
    console.error('Ticket Creation Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // ตรวจสอบ session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // รับค่า query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const paymentMethod = searchParams.get('paymentMethod');
    const includeRevenue = searchParams.get('includeRevenue') === 'true';
    
    console.log('GET tickets request:', { page, limit, paymentMethod, includeRevenue });
    
    // สร้าง filter
    const filter: any = {};
    
    // ถ้ามีการกรองด้วยวิธีการชำระเงิน
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    console.log('Using filter:', filter);
    
    // คำนวณค่า skip สำหรับ pagination
    const skip = (page - 1) * limit;
    
    // นับจำนวนตั๋วทั้งหมด
    const totalItems = await Ticket.countDocuments(filter);
    console.log('Total tickets found:', totalItems);
    
    // ดึงข้อมูลตั๋วตามเงื่อนไข
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 }) // เรียงจากล่าสุด
      .skip(skip)
      .limit(limit);
    
    console.log('Retrieved tickets:', tickets.length);
    
    let ticketsWithRevenue = tickets;
    
    // ถ้าต้องการข้อมูล revenue ด้วย
    if (includeRevenue) {
      console.log('Including revenue data...');
      
      ticketsWithRevenue = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            const incomeRecords = await Income.find({ ticket_id: ticket._id })
              .populate('driver_id', 'name employeeId')
              .populate('user_id', 'name employeeId');
            
            return {
              ...ticket.toObject(),
              revenueData: {
                totalIncomeRecords: incomeRecords.length,
                companyShare: incomeRecords.find(r => r.revenue_share_type === 'company')?.income_amount || 0,
                stationShare: incomeRecords.find(r => r.revenue_share_type === 'station')?.income_amount || 0,
                driverShare: incomeRecords.filter(r => r.revenue_share_type === 'driver')
                  .reduce((sum, r) => sum + r.income_amount, 0),
                workingDriversCount: incomeRecords[0]?.working_drivers_count || 0,
                driverIncomes: incomeRecords
                  .filter(r => r.revenue_share_type === 'driver')
                  .map(r => ({
                    driverId: r.driver_id?._id,
                    driverName: r.driver_id?.name,
                    employeeId: r.driver_id?.employeeId,
                    amount: r.income_amount,
                    isDistributed: r.is_distributed
                  }))
              }
            };
          } catch (revenueError) {
            console.error(`Failed to load revenue for ticket ${ticket._id}:`, revenueError);
            return {
              ...ticket.toObject(),
              revenueData: null,
              revenueError: 'Failed to load revenue data'
            };
          }
        })
      );
    }
    
    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(totalItems / limit);
    
    const result = {
      tickets: ticketsWithRevenue,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      },
      meta: {
        includeRevenue,
        hasRevenueData: includeRevenue
      }
    };
    
    console.log('Returning tickets response:', {
      ticketCount: result.tickets.length,
      totalItems: result.pagination.totalItems,
      currentPage: result.pagination.currentPage,
      includeRevenue: result.meta.includeRevenue
    });
    
    // ส่งข้อมูลตั๋วและข้อมูล pagination กลับ
    return NextResponse.json(result);
  } catch (error) {
    console.error('Ticket Fetch Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}