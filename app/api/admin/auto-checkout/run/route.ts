// app/api/admin/auto-checkout/run/route.ts - แก้ไขให้ไม่ใช้ Models
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WorkLog from '@/models/WorkLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - ดำเนินการ Auto Checkout ทันที (ใช้ WorkLog แทน AutoCheckoutLog)
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
    
    console.log('🚀 Starting manual auto checkout process...');
    console.log('👤 Executed by:', session.user.email || session.user.name);
    
    // ค้นหาผู้ใช้ที่ยังเช็คอินอยู่
    const checkedInUsers = await User.find({
      checkInStatus: 'checked-in',
      role: { $in: ['driver', 'staff'] }
    }).select('_id name employeeId role email lastCheckIn');
    
    console.log(`👥 Found ${checkedInUsers.length} users still checked in`);
    
    if (checkedInUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ບໍ່ມີຜູ້ໃຊ້ທີ່ຍັງເຊັກອິນຢູ່',
        checkedOutCount: 0,
        checkedOutUsers: []
      });
    }
    
    const results = [];
    const now = new Date();
    
    // ทำการ checkout ให้ผู้ใช้แต่ละคน
    for (const user of checkedInUsers) {
      try {
        console.log(`🔄 Processing checkout for: ${user.name} (${user.employeeId})`);
        
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
        
        // ✅ ใช้ WorkLog ที่มีอยู่แล้วแทน AutoCheckoutLog
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
        
        console.log(`✅ Auto checkout successful for ${user.name} (${user.employeeId}) - ${workHours.toFixed(2)} hours`);
      } catch (userError) {
        console.error(`❌ Auto checkout failed for user ${user._id}:`, userError);
        
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
    
    console.log(`📊 Auto checkout completed: ${successfulCheckouts.length} successful, ${failedCheckouts.length} failed`);
    
    // ✅ บันทึกประวัติการดำเนินการใน Console แทน Database
    const executionLog = {
      executedBy: {
        id: session.user.id,
        email: session.user.email || session.user.name,
        name: session.user.name
      },
      executedAt: now,
      totalUsers: checkedInUsers.length,
      successfulCheckouts: successfulCheckouts.length,
      failedCheckouts: failedCheckouts.length,
      executionType: 'manual',
      details: results,
      summary: {
        totalWorkHours: successfulCheckouts.reduce((sum, user) => sum + (user.workHours || 0), 0),
        avgWorkHours: successfulCheckouts.length > 0 
          ? successfulCheckouts.reduce((sum, user) => sum + (user.workHours || 0), 0) / successfulCheckouts.length 
          : 0
      }
    };
    
    console.log('📋 Manual Auto Checkout Execution Log:', JSON.stringify(executionLog, null, 2));
    
    // สร้างข้อความสรุป
    const summaryMessage = successfulCheckouts.length > 0 
      ? `🎉 ດຳເນີນການ Auto Checkout ສຳເລັດ: ${successfulCheckouts.length} ຄົນ` +
        (failedCheckouts.length > 0 ? ` (ລົ້ມເຫລວ ${failedCheckouts.length} ຄົນ)` : '')
      : '⚠️ ບໍ່ມີຜູ້ໃຊ້ໃດຖືກ checkout';
    
    console.log('📢 Summary:', summaryMessage);
    
    // ส่งข้อมูลกลับ
    return NextResponse.json({
      success: true,
      message: summaryMessage,
      checkedOutCount: successfulCheckouts.length,
      failedCount: failedCheckouts.length,
      executedAt: now,
      executedBy: session.user.email || session.user.name,
      checkedOutUsers: successfulCheckouts,
      failedUsers: failedCheckouts,
      summary: executionLog.summary,
      note: 'Execution details logged to console'
    });
    
  } catch (error) {
    console.error('💥 Auto Checkout Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute auto checkout: ' + (error as Error).message,
        details: error instanceof Error ? error.stack : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}