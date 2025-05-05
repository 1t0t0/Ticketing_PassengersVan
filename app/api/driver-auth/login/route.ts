// app/api/driver-auth/login/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/models/Driver';
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
    
    const driver = await Driver.findOne({ employeeId });
    
    if (!driver) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const isPasswordValid = await bcrypt.compare(password, driver.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // สร้าง token
    const token = jwt.sign(
      { id: driver._id, employeeId: driver.employeeId },
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