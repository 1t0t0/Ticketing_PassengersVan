// app/api/admin/auto-checkout/run/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WorkLog from '@/models/WorkLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - ดำเนินการ Auto Checkout ทันที
export async function POST(request: Request) {
  try {
    // ตรวจสอบสิทธิ์ (เฉพาะ admin)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can run auto checkout' },
        { status: 401 }
      );
    }

    await connectDB();
    
    console.log('Starting auto checkout process...');
    
    // ค้นหาผู้ใช้ที่ยังเช็คอินอยู่
    const checkedInUsers = await User.find({
      checkInStatus: 'checked-in',
      role: { $in: ['driver', 'staff'] }
    }).select('_id name employeeId role email lastCheckIn');
    
    console.log(`Found ${checkedInUsers.length} users still checked in`);
    
    if (checkedInUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users currently checked in',
        checkedOutCount: 0,
        checkedOutUsers: []
      });
    }
    
    const results = [];
    const now = new Date();
    
    // ทำการ checkout ให้ผู้ใช้แต่ละคน
    for (const user of checkedInUsers) {
      try {
        // อัพเดทสถานะการเช็คอิน
        await User.findByIdAndUpdate(
          user._id,
          { 
            $set: { 
              checkInStatus: 'checked-out',
              lastCheckOut: now 
            }
          }
        );
        
        // บันทึก WorkLog
        await WorkLog.logWorkAction(user._id.toString(), 'check-out');
        
        // คำนวณชั่วโมงทำงาน
        let workHours = 0;
        if (user.lastCheckIn) {
          const checkInTime = new Date(user.lastCheckIn);
          workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        }
        
        results.push({
          userId: user._id,
          name: user.name,
          employeeId: user.employeeId,
          role: user.role,
          checkOutTime: now,
          workHours: Math.round(workHours * 100) / 100,
          status: 'success'
        });
        
        console.log(`Auto checkout successful for ${user.name} (${user.employeeId})`);
      } catch (userError) {
        console.error(`Auto checkout failed for user ${user._id}:`, userError);
        
        results.push({
          userId: user._id,
          name: user.name,
          employeeId: user.employeeId,
          role: user.role,
          status: 'failed',
          error: (userError as Error).message
        });
      }
    }
    
    // นับจำนวนผู้ใช้ที่ checkout สำเร็จ
    const successfulCheckouts = results.filter(r => r.status === 'success');
    const failedCheckouts = results.filter(r => r.status === 'failed');
    
    console.log(`Auto checkout completed: ${successfulCheckouts.length} successful, ${failedCheckouts.length} failed`);
    
    // บันทึกประวัติการดำเนินการ
    try {
      const mongoose = require('mongoose');
      
      const AutoCheckoutLog = mongoose.models.AutoCheckoutLog || mongoose.model('AutoCheckoutLog', new mongoose.Schema({
        executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        executedAt: { type: Date, default: Date.now },
        totalUsers: Number,
        successfulCheckouts: Number,
        failedCheckouts: Number,
        details: [mongoose.Schema.Types.Mixed],
        executionType: { type: String, enum: ['manual', 'scheduled'], default: 'manual' }
      }));
      
      await AutoCheckoutLog.create({
        executedBy: session.user.id,
        executedAt: now,
        totalUsers: checkedInUsers.length,
        successfulCheckouts: successfulCheckouts.length,
        failedCheckouts: failedCheckouts.length,
        details: results,
        executionType: 'manual'
      });
    } catch (logError) {
      console.error('Failed to log auto checkout execution:', logError);
      // ไม่ให้ล้มเหลวทั้งหมดถ้าบันทึก log ไม่สำเร็จ
    }
    
    // อัพเดทการตั้งค่า Auto Checkout ด้วยข้อมูลล่าสุด
    try {
      const mongoose = require('mongoose');
      const AutoCheckoutSettings = mongoose.models.AutoCheckoutSettings || 
                                  mongoose.model('AutoCheckoutSettings', new mongoose.Schema({
                                    enabled: Boolean,
                                    checkoutTime: String,
                                    timezone: String,
                                    lastRun: Date,
                                    affectedUsers: Number
                                  }));
      
      await AutoCheckoutSettings.findOneAndUpdate(
        {},
        { 
          $set: { 
            lastRun: now,
            affectedUsers: successfulCheckouts.length 
          }
        },
        { sort: { createdAt: -1 } }
      );
    } catch (settingsError) {
      console.error('Failed to update auto checkout settings:', settingsError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Auto checkout completed successfully`,
      checkedOutCount: successfulCheckouts.length,
      failedCount: failedCheckouts.length,
      executedAt: now,
      checkedOutUsers: successfulCheckouts,
      failedUsers: failedCheckouts
    });
    
  } catch (error) {
    console.error('Auto Checkout Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute auto checkout: ' + (error as Error).message,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}