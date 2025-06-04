// lib/autoCheckoutScheduler.ts
import cron from 'node-cron';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WorkLog from '@/models/WorkLog';

interface AutoCheckoutSettings {
  enabled: boolean;
  checkoutTime: string;
  timezone: string;
}

class AutoCheckoutScheduler {
  private scheduledTask: cron.ScheduledTask | null = null;
  private isInitialized = false;

  /**
   * เริ่มต้นระบบ Auto Checkout Scheduler
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('Auto Checkout Scheduler already initialized');
      return;
    }

    try {
      await this.loadAndSchedule();
      this.isInitialized = true;
      console.log('Auto Checkout Scheduler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Auto Checkout Scheduler:', error);
    }
  }

  /**
   * โหลดการตั้งค่าและสร้าง schedule ใหม่
   */
  async loadAndSchedule() {
    try {
      const settings = await this.getCurrentSettings();
      
      if (settings && settings.enabled) {
        await this.scheduleAutoCheckout(settings);
        console.log(`Auto Checkout scheduled at ${settings.checkoutTime} (${settings.timezone})`);
      } else {
        this.stopSchedule();
        console.log('Auto Checkout is disabled or no settings found');
      }
    } catch (error) {
      console.error('Error loading auto checkout settings:', error);
    }
  }

  /**
   * ดึงการตั้งค่าปัจจุบันจากฐานข้อมูล
   */
  private async getCurrentSettings(): Promise<AutoCheckoutSettings | null> {
    try {
      await connectDB();
      const mongoose = require('mongoose');
      
      const AutoCheckoutSettings = mongoose.models.AutoCheckoutSettings || 
                                  mongoose.model('AutoCheckoutSettings', new mongoose.Schema({
                                    enabled: Boolean,
                                    checkoutTime: String,
                                    timezone: String,
                                    lastRun: Date,
                                    affectedUsers: Number
                                  }));

      const settings = await AutoCheckoutSettings.findOne().sort({ createdAt: -1 });
      return settings ? {
        enabled: settings.enabled,
        checkoutTime: settings.checkoutTime,
        timezone: settings.timezone
      } : null;
    } catch (error) {
      console.error('Error fetching auto checkout settings:', error);
      return null;
    }
  }

  /**
   * สร้าง cron job สำหรับ Auto Checkout
   */
  private async scheduleAutoCheckout(settings: AutoCheckoutSettings) {
    // หยุด schedule เดิมก่อน (ถ้ามี)
    this.stopSchedule();

    // แปลงเวลาเป็น cron format
    const [hours, minutes] = settings.checkoutTime.split(':');
    const cronExpression = `${minutes} ${hours} * * 1-6`; // จันทร์-เสาร์

    console.log(`Creating cron job with expression: ${cronExpression}`);

    // สร้าง scheduled task ใหม่
    this.scheduledTask = cron.schedule(cronExpression, async () => {
      console.log('Auto Checkout scheduled task executing...');
      await this.executeAutoCheckout();
    }, {
      scheduled: true,
      timezone: settings.timezone || 'Asia/Vientiane'
    });

    console.log('Auto Checkout cron job created successfully');
  }

  /**
   * ดำเนินการ Auto Checkout
   */
  private async executeAutoCheckout() {
    try {
      console.log('Starting scheduled auto checkout...');
      
      await connectDB();
      
      // ค้นหาผู้ใช้ที่ยังเช็คอินอยู่
      const checkedInUsers = await User.find({
        checkInStatus: 'checked-in',
        role: { $in: ['driver', 'staff'] }
      }).select('_id name employeeId role lastCheckIn');

      console.log(`Found ${checkedInUsers.length} users still checked in`);

      if (checkedInUsers.length === 0) {
        console.log('No users to check out');
        return;
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

      // บันทึกประวัติการดำเนินการ
      await this.logAutoCheckoutExecution(results, 'scheduled');

      // อัพเดทการตั้งค่าด้วยข้อมูลล่าสุด
      await this.updateLastRunInfo(now, results.filter(r => r.status === 'success').length);

      const successCount = results.filter(r => r.status === 'success').length;
      const failCount = results.filter(r => r.status === 'failed').length;

      console.log(`Scheduled auto checkout completed: ${successCount} successful, ${failCount} failed`);
      
    } catch (error) {
      console.error('Error executing scheduled auto checkout:', error);
      
      // บันทึก error log
      await this.logAutoCheckoutExecution([], 'scheduled', (error as Error).message);
    }
  }

  /**
   * บันทึกประวัติการดำเนินการ Auto Checkout
   */
  private async logAutoCheckoutExecution(results: any[], executionType: 'manual' | 'scheduled', errorMessage?: string) {
    try {
      const mongoose = require('mongoose');
      
      const AutoCheckoutLog = mongoose.models.AutoCheckoutLog || mongoose.model('AutoCheckoutLog', new mongoose.Schema({
        executedAt: { type: Date, default: Date.now },
        totalUsers: Number,
        successfulCheckouts: Number,
        failedCheckouts: Number,
        details: [mongoose.Schema.Types.Mixed],
        executionType: { type: String, enum: ['manual', 'scheduled'] },
        errorMessage: String
      }));

      const successfulCheckouts = results.filter(r => r.status === 'success');
      const failedCheckouts = results.filter(r => r.status === 'failed');

      await AutoCheckoutLog.create({
        executedAt: new Date(),
        totalUsers: results.length,
        successfulCheckouts: successfulCheckouts.length,
        failedCheckouts: failedCheckouts.length,
        details: results,
        executionType,
        errorMessage
      });
    } catch (logError) {
      console.error('Failed to log auto checkout execution:', logError);
    }
  }

  /**
   * อัพเดทข้อมูลการดำเนินการล่าสุด
   */
  private async updateLastRunInfo(lastRun: Date, affectedUsers: number) {
    try {
      const mongoose = require('mongoose');
      const AutoCheckoutSettings = mongoose.models.AutoCheckoutSettings;
      
      if (AutoCheckoutSettings) {
        await AutoCheckoutSettings.findOneAndUpdate(
          {},
          { 
            $set: { 
              lastRun,
              affectedUsers 
            }
          },
          { sort: { createdAt: -1 } }
        );
      }
    } catch (error) {
      console.error('Failed to update last run info:', error);
    }
  }

  /**
   * หยุด schedule ปัจจุบัน
   */
  private stopSchedule() {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask.destroy();
      this.scheduledTask = null;
      console.log('Previous auto checkout schedule stopped');
    }
  }

  /**
   * อัพเดท schedule ใหม่ (เรียกจาก API เมื่อมีการเปลี่ยนแปลงการตั้งค่า)
   */
  async updateSchedule() {
    console.log('Updating auto checkout schedule...');
    await this.loadAndSchedule();
  }

  /**
   * ปิดการทำงานของ scheduler
   */
  destroy() {
    this.stopSchedule();
    this.isInitialized = false;
    console.log('Auto Checkout Scheduler destroyed');
  }
}

// สร้าง instance เดียวสำหรับใช้งานทั้งแอป
const autoCheckoutScheduler = new AutoCheckoutScheduler();

export default autoCheckoutScheduler;

// ฟังก์ชันเริ่มต้นระบบ (เรียกใน app startup)
export const initializeAutoCheckout = async () => {
  await autoCheckoutScheduler.initialize();
};

// ฟังก์ชันอัพเดท schedule (เรียกจาก API)
export const updateAutoCheckoutSchedule = async () => {
  await autoCheckoutScheduler.updateSchedule();
};