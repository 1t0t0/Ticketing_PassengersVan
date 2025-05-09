// app/api/users/[id]/checkin/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - ตั้งค่า check in/out status ของผู้ใช้
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Parse request body
    const body = await request.json();
    const { checkInStatus } = body;
    
    // Validate status
    if (!checkInStatus || !['checked-in', 'checked-out'].includes(checkInStatus)) {
      return NextResponse.json(
        { error: 'Invalid check in status' },
        { status: 400 }
      );
    }
    
    // Find user by ID
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is driver or staff
    if (!['driver', 'staff'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only drivers and staff can be checked in/out' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบสิทธิ์
    
    // 1. Admin สามารถ Check in/out ให้ทุกคนได้
    // 2. Staff สามารถ Check in/out ให้ตัวเองและ Driver ได้
    // 3. Driver ไม่สามารถ Check in/out ให้ตัวเองได้
    
    const currentUserRole = session.user.role;
    const currentUserId = session.user.id;
    const targetUserId = params.id;
    const targetUserRole = user.role;
    
    // ถ้าเป็น admin อนุญาตทุกกรณี
    if (currentUserRole === 'admin') {
      // Allow access
    }
    // ถ้าเป็น staff
    else if (currentUserRole === 'staff') {
      // Staff สามารถเปลี่ยนสถานะของตัวเองหรือ driver ได้
      if (targetUserRole === 'staff' && targetUserId !== currentUserId) {
        // Staff ไม่สามารถเปลี่ยนสถานะของ staff คนอื่นได้
        return NextResponse.json(
          { error: 'Staff can only change status of themselves or drivers' },
          { status: 403 }
        );
      }
    }
    // ถ้าเป็น driver หรือบทบาทอื่นๆ
    else {
      // Driver และบทบาทอื่นๆ ไม่มีสิทธิ์เปลี่ยน check in status
      return NextResponse.json(
        { error: 'You do not have permission to change check in status' },
        { status: 403 }
      );
    }
    
    // Update check in status
    let updateData: any = {
      checkInStatus
    };
    
    // Add timestamp for last check in/out
    if (checkInStatus === 'checked-in') {
      updateData.lastCheckIn = new Date();
    } else {
      updateData.lastCheckOut = new Date();
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Check In/Out Error:', error);
    return NextResponse.json(
      { error: 'Failed to update check in status' },
      { status: 500 }
    );
  }
}



// DELETE - ลบผู้ใช้
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ Admin เท่านั้นที่ลบได้)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // หาผู้ใช้ก่อนลบ (เพื่อให้รู้ว่า role อะไร)
    const user = await User.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // ป้องกันการลบ admin คนสุดท้าย
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin' },
          { status: 400 }
        );
      }
    }
    
    // ลบผู้ใช้
    const deletedUser = await User.findByIdAndDelete(params.id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete User Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}