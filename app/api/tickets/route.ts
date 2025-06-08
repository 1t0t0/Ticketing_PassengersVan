// app/api/tickets/route.ts - UUID Ticket System (6 Characters)
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 🎯 ตัวอักษรที่ใช้ได้ (ไม่รวมตัวที่สับสน)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// ไม่มี: I, O (สับสนกับ 1, 0) และ 0, 1 (สับสนกับ O, I)

/**
 * 🎲 สร้าง Ticket Number แบบ UUID (6 ตัวอักษร)
 * รูปแบบ: T + 5 หลักสุ่ม
 * ตัวอย่าง: TK7M2X, TH9Q4P, TZ8R6N
 */
function generateUUIDTicketNumber(): string {
  let result = 'T';
  
  // สร้าง 5 หลักสุ่ม
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
    result += SAFE_CHARS[randomIndex];
  }
  
  return result;
}

/**
 * 🔒 สร้าง Ticket Number ที่ไม่ซ้ำแน่นอน
 * ลองสร้างจนกว่าจะได้ตัวที่ไม่ซ้ำ
 */
async function generateUniqueTicketNumber(): Promise<string> {
  const maxAttempts = 20; // ลองสูงสุด 20 ครั้ง
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    const candidateNumber = generateUUIDTicketNumber();
    
    console.log(`🎲 Generated candidate: ${candidateNumber} (attempt ${attempt})`);
    
    // ตรวจสอบว่าซ้ำมั้ย
    const existingTicket = await Ticket.findOne({ ticketNumber: candidateNumber });
    
    if (!existingTicket) {
      console.log(`✅ Unique ticket number found: ${candidateNumber}`);
      return candidateNumber;
    }
    
    console.log(`⚠️ ${candidateNumber} already exists, trying again...`);
  }
  
  // 🆘 ถ้าลองแล้วยังซ้ำ (โอกาสน้อยมาก) ให้ใส่ timestamp
  const timestamp = Date.now().toString().slice(-2);
  const emergency = `T${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${timestamp}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}`;
  
  console.log(`🆘 Using emergency number: ${emergency}`);
  return emergency;
}

/**
 * 🎫 สร้าง Ticket พร้อมกับการป้องกันการซ้ำ
 */
async function createTicketSafely(ticketData: any): Promise<any> {
  const maxRetries = 3;
  
  for (let retry = 1; retry <= maxRetries; retry++) {
    try {
      console.log(`💾 Creating ticket (attempt ${retry}/${maxRetries})`);
      
      // สร้าง ticket number ใหม่ทุกครั้ง
      const ticketNumber = await generateUniqueTicketNumber();
      
      const fullTicketData = {
        ...ticketData,
        ticketNumber
      };
      
      console.log('📝 Ticket data:', fullTicketData);
      
      // สร้าง ticket ในฐานข้อมูล
      const ticket = await Ticket.create(fullTicketData);
      
      console.log(`🎉 Ticket created successfully: ${ticket.ticketNumber}`);
      return ticket;
      
    } catch (error: any) {
      console.error(`❌ Create attempt ${retry} failed:`, error.message);
      
      // ถ้าเป็น duplicate key error และยังลองได้
      if (error.code === 11000 && retry < maxRetries) {
        console.log(`🔄 Duplicate key detected, retrying...`);
        // รอสักหน่อยก่อนลองใหม่
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }
      
      // ถ้าไม่ใช่ duplicate หรือลองครบแล้ว
      throw error;
    }
  }
  
  throw new Error('Failed to create ticket after multiple attempts');
}

// 🚀 API Route สำหรับสร้าง Ticket
export async function POST(request: Request) {
  try {
    console.log('🎯 Starting UUID ticket creation...');
    
    // ตรวจสอบ session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // เชื่อมต่อฐานข้อมูล
    await connectDB();

    // รับข้อมูลจาก request
    const body = await request.json();
    const { price, paymentMethod } = body;

    console.log('📋 Request data:', { 
      price, 
      paymentMethod, 
      soldBy: session.user.email 
    });

    // ตรวจสอบข้อมูล
    if (!price || !paymentMethod) {
      return NextResponse.json(
        { error: 'Price and Payment Method are required' }, 
        { status: 400 }
      );
    }

    // เตรียมข้อมูล ticket
    const ticketData = {
      price: Number(price),
      paymentMethod,
      soldBy: session.user.email || session.user.name || 'System',
      soldAt: new Date()
    };

    // 🎲 สร้าง ticket ด้วยระบบ UUID
    const ticket = await createTicketSafely(ticketData);

    console.log('🎊 Final ticket created:', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      price: ticket.price,
      soldAt: ticket.soldAt
    });

    // ส่งกลับข้อมูล ticket
    return NextResponse.json(ticket.toObject());

  } catch (error) {
    console.error('💥 UUID Ticket Creation Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// 📋 API Route สำหรับดึงข้อมูล Ticket (เหมือนเดิม)
export async function GET(request: Request) {
  try {
    // ตรวจสอบ session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // รับ query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const paymentMethod = searchParams.get('paymentMethod');
    
    console.log('📖 GET tickets request:', { page, limit, paymentMethod });
    
    // สร้าง filter
    const filter: any = {};
    
    if (paymentMethod && (paymentMethod === 'cash' || paymentMethod === 'qr')) {
      filter.paymentMethod = paymentMethod;
    }
    
    // คำนวณ pagination
    const skip = (page - 1) * limit;
    
    // นับจำนวนทั้งหมด
    const totalItems = await Ticket.countDocuments(filter);
    
    // ดึงข้อมูล
    const tickets = await Ticket.find(filter)
      .sort({ soldAt: -1 }) // เรียงจากใหม่ไปเก่า
      .skip(skip)
      .limit(limit);
    
    const totalPages = Math.ceil(totalItems / limit);
    
    console.log(`📊 Retrieved ${tickets.length} tickets from ${totalItems} total`);
    
    return NextResponse.json({
      tickets: tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit
      },
      meta: {
        generationType: 'UUID',
        ticketFormat: 'T + 5 random chars (6 total)',
        sampleFormat: 'TK7M2X'
      }
    });
    
  } catch (error) {
    console.error('📖 Ticket Fetch Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// 🔍 ฟังก์ชันทดสอบ (สำหรับ debug)
export async function generateSampleTickets(count: number = 10): Promise<string[]> {
  const samples: string[] = [];
  const used = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let ticket;
    do {
      ticket = generateUUIDTicketNumber();
    } while (used.has(ticket));
    
    used.add(ticket);
    samples.push(ticket);
  }
  
  return samples;
}

// 📊 ฟังก์ชันแสดงสถิติ
export function getUUIDStats() {
  return {
    format: 'T + 5 random characters',
    totalLength: 6,
    possibleCombinations: Math.pow(SAFE_CHARS.length, 5),
    safeCharacters: SAFE_CHARS,
    excludedCharacters: 'I, O, 0, 1 (to avoid confusion)',
    collisionProbability: '1 in ' + Math.pow(SAFE_CHARS.length, 5).toLocaleString()
  };
}