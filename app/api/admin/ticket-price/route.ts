// app/api/admin/ticket-price/route.ts - Simple version without new model
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

// File to store price (simple JSON file)
const PRICE_FILE = path.join(process.cwd(), 'data', 'ticket-price.json');

// Default price
const DEFAULT_PRICE = 45000;

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read price from file
async function readPrice() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PRICE_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.price || DEFAULT_PRICE;
  } catch (error) {
    // File doesn't exist or is invalid, return default
    return DEFAULT_PRICE;
  }
}

// Write price to file
async function writePrice(price: number, updatedBy: string) {
  try {
    await ensureDataDir();
    const data = {
      price: price,
      updatedBy: updatedBy,
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(PRICE_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing price file:', error);
    return false;
  }
}

// GET - ดึงราคาปี้ปัจจุบัน
export async function GET(request: Request) {
  try {
    // ทุกคนสามารถดูราคาปี้ได้
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticketPrice = await readPrice();
    
    return NextResponse.json({
      success: true,
      ticketPrice: ticketPrice
    });
  } catch (error) {
    console.error('Get Ticket Price Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket price' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทราคาปี้ (เฉพาะ admin)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can update ticket price' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { price } = body;
    
    // ตรวจสอบราคา
    if (!price || isNaN(Number(price))) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      );
    }
    
    const numericPrice = Number(price);
    
    if (numericPrice <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }
    
    if (numericPrice > 1000000) {
      return NextResponse.json(
        { error: 'Price cannot exceed 1,000,000 LAK' },
        { status: 400 }
      );
    }
    
    // บันทึกราคาใหม่
    const success = await writePrice(numericPrice, session.user.email || session.user.name || 'Admin');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save price' },
        { status: 500 }
      );
    }
    
    console.log(`Ticket price updated to ${numericPrice} LAK by ${session.user.email}`);
    
    return NextResponse.json({
      success: true,
      ticketPrice: numericPrice,
      message: `ອັບເດດລາຄາປີ້ເປັນ ₭${numericPrice.toLocaleString()} ສຳເລັດແລ້ວ`
    });
  } catch (error) {
    console.error('Update Ticket Price Error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket price: ' + (error as Error).message },
      { status: 500 }
    );
  }
}