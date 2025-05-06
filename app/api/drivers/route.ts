// app/api/drivers/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    const drivers = await Driver.find().sort({ createdAt: -1 });
    return NextResponse.json(drivers);
  } catch  {
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Extract password from body
    const { name, phone, email, password } = body;
    
    // Check if required fields are present
    if (!name || !phone || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, phone, email, and password are required' 
      }, { status: 400 });
    }
    
    // Generate employee ID with more robust logic
    const lastDriver = await Driver.findOne().sort({ employeeId: -1 });
    let nextEmployeeId = 'D0001';
    
    if (lastDriver && lastDriver.employeeId) {
      const lastNumber = parseInt(lastDriver.employeeId.substring(1));
      let nextNumber = lastNumber + 1;
      
      // Ensure unique employeeId
      while (await Driver.findOne({ employeeId: `D${nextNumber.toString().padStart(4, '0')}` })) {
        nextNumber++;
      }
      
      nextEmployeeId = `D${nextNumber.toString().padStart(4, '0')}`;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First, create a user account for the driver
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'driver'
    });
    
    // Then, create the driver record linked to the user
    const driverData = {
      name,
      phone,
      email,
      employeeId: nextEmployeeId,
      userId: newUser._id,
      status: 'active',
      checkInStatus: 'checked-out'
    };
    
    const driver = await Driver.create(driverData);
    return NextResponse.json(driver);
  } catch (error) {
    console.error('Detailed Error creating driver:', error);
    return NextResponse.json({ 
      error: 'Failed to create driver', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}