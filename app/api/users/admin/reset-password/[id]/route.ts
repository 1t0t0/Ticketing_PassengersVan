// app/api/users/admin/reset-password/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST - Reset user password and return a temporary one
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization (only admin)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can reset passwords' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get user ID from params
    const userId = params.id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update user with new password
    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword }
    );
    
    return NextResponse.json({
      success: true,
      temporaryPassword: tempPassword,
      message: `รหัสผ่านชั่วคราวถูกสร้างขึ้น: ${tempPassword}`
    });
  } catch (error) {
    console.error('Password Reset Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password: ' + (error as Error).message },
      { status: 500 }
    );
  }
}