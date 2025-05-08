// app/api/users/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Get all users
export async function GET(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get query parameters (optional)
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    // Build query
    const query: any = {};
    if (role) {
      query.role = role;
    }
    
    // Find users based on query
    const users = await User.find(query).select('-password');
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: Request) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Parse request body
    const body = await request.json();
    console.log('User creation request body:', body);
    
    const { name, email, password, role, phone, employeeId } = body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user object
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role
    };
    
    // Add role-specific fields
    if (role === 'driver') {
      // Generate employee ID if not provided
      const driverId = employeeId || `D-${Date.now().toString().slice(-6)}`;
      
      // Check if driver with this employeeId already exists
      const existingDriver = await User.findOne({ employeeId: driverId, role: 'driver' });
      if (existingDriver) {
        return NextResponse.json(
          { error: 'Driver with this Employee ID already exists' },
          { status: 409 }
        );
      }
      
      userData.employeeId = driverId;
      if (phone) userData.phone = phone;
      userData.status = 'active';
      userData.checkInStatus = 'checked-out';
      
      console.log('Creating driver with data:', userData);
    } else if (role === 'staff') {
      if (phone) userData.phone = phone;
      console.log('Creating staff with data:', userData);
    }
    
    // Create user
    const newUser = await User.create(userData);
    console.log('User created successfully:', newUser);
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Create User Error:', error);
    return NextResponse.json(
      { error: 'Failed to create user: ' + (error as Error).message },
      { status: 500 }
    );
  }
}