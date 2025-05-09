// app/api/users/search/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Search for users based on query parameters
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const role = searchParams.get('role');
    
    // Build the query object
    const query: any = {};
    
    // Add search term to query if provided
    if (term) {
      // Search across multiple fields using $or operator
      query.$or = [
        { name: { $regex: term, $options: 'i' } },        // Name search
        { email: { $regex: term, $options: 'i' } },       // Email search
        { phone: { $regex: term, $options: 'i' } },       // Phone search
        { employeeId: { $regex: term, $options: 'i' } },  // Employee ID search
        { stationId: { $regex: term, $options: 'i' } },   // Station ID search
      ];
    }
    
    // Filter by role if provided and not 'all'
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Execute the search query
    const users = await User.find(query).select('-password');
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('User Search Error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}