// app/api/driver-auth/login/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'driver-secret-key';

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const { employeeId, password } = await request.json();
    
    if (!employeeId || !password) {
      return NextResponse.json({ error: 'Employee ID and password are required' }, { status: 400 });
    }
    
    // Find the driver by employeeId
    const driver = await Driver.findOne({ employeeId });
    
    if (!driver) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Find the associated user account
    const user = await User.findById(driver.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'Driver account not properly configured' }, { status: 401 });
    }
    
    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Create a token
    const token = jwt.sign(
      { 
        id: driver._id, 
        employeeId: driver.employeeId,
        userId: user._id 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return NextResponse.json({
      success: true,
      driver: {
        id: driver._id,
        name: driver.name,
        employeeId: driver.employeeId,
        email: driver.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}