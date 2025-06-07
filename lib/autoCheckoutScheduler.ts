// lib/autoCheckoutScheduler.ts - Fixed TypeScript types
import * as cron from 'node-cron';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WorkLog from '@/models/WorkLog';
import mongoose from 'mongoose';

interface AutoCheckoutSettings {
  enabled: boolean;
  checkoutTime: string;
  timezone: string;
}

interface CheckedInUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  employeeId?: string;
  role: string;
  lastCheckIn?: Date;
}

interface AutoCheckoutResult {
  userId: mongoose.Types.ObjectId;
  name: string;
  employeeId?: string;
  role: string;
  workHours?: number;
  status: 'success' | 'failed';
  error?: string;
}

interface AutoCheckoutLogEntry {
  executedAt: Date;
  totalUsers: number;
  successfulCheckouts: number;
  failedCheckouts: number;
  details: AutoCheckoutResult[];
  executionType: 'manual' | 'scheduled';
  errorMessage?: string;
}

// Define Mongoose schemas with proper typing
const AutoCheckoutSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, required: true },
  checkoutTime: { type: String, required: true },
  timezone: { type: String, default: 'Asia/Vientiane' },
  lastRun: { type: Date },
  affectedUsers: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AutoCheckoutLogSchema = new mongoose.Schema({
  executedAt: { type: Date, default: Date.now },
  totalUsers: { type: Number, required: true },
  successfulCheckouts: { type: Number, required: true },
  failedCheckouts: { type: Number, required: true },
  details: [{ type: mongoose.Schema.Types.Mixed }],
  executionType: { 
    type: String, 
    enum: ['manual', 'scheduled'], 
    required: true 
  },
  errorMessage: { type: String }
});

class AutoCheckoutScheduler {
  private scheduledTask: cron.ScheduledTask | null = null;
  private isInitialized = false;

  /**
   * เริ่มต้นระบบ Auto Checkout Scheduler
   */
  async initialize(): Promise<void> {
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
  async loadAndSchedule(): Promise<void> {
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
      
      const AutoCheckoutSettingsModel = mongoose.models.AutoCheckoutSettings || 
                                       mongoose.model('AutoCheckoutSettings', AutoCheckoutSettingsSchema);

      const settings = await AutoCheckoutSettingsModel.findOne().sort({ createdAt: -1 });
      
      if (!settings) {
        return null;
      }

      return {
        enabled: settings.enabled,
        checkoutTime: settings.checkoutTime,
        timezone: settings.timezone
      };
    } catch (error) {
      console.error('Error fetching auto checkout settings:', error);
      return null;
    }
  }

  /**
   * สร้าง cron job สำหรับ Auto Checkout
   */
  private async scheduleAutoCheckout(settings: AutoCheckoutSettings): Promise<void> {
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
  private async executeAutoCheckout(): Promise<void> {
    try {
      console.log('Starting scheduled auto checkout...');
      
      await connectDB();
      
      // ค้นหาผู้ใช้ที่ยังเช็คอินอยู่
      const checkedInUsers: CheckedInUser[] = await User.find({
        checkInStatus: 'checked-in',
        role: { $in: ['driver', 'staff'] }
      }).select('_id name employeeId role lastCheckIn').lean();

      console.log(`Found ${checkedInUsers.length} users still checked in`);

      if (checkedInUsers.length === 0) {
        console.log('No users to check out');
        return;
      }

      const results: AutoCheckoutResult[] = [];
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

          // บันทึก WorkLog - ตรวจสอบว่า method มีอยู่จริง
          try {
            if (WorkLog && typeof WorkLog.logWorkAction === 'function') {
              await WorkLog.logWorkAction(user._id.toString(), 'check-out');
            } else {
              // สร้าง WorkLog แบบ manual หาก logWorkAction ไม่มี
              await WorkLog.create({
                user_id: user._id,
                action: 'check-out',
                timestamp: now,
                date: now.toISOString().split('T')[0]
              });
            }
          } catch (workLogError) {
            console.warn(`Failed to create work log for user ${user._id}:`, workLogError);
            // ทำต่อไปแม้ work log จะล้มเหลว
          }

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

          console.log(`Auto checkout successful for ${user.name} (${user.employeeId || 'N/A'})`);
        } catch (userError) {
          console.error(`Auto checkout failed for user ${user._id}:`, userError);
          
          const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';
          
          results.push({
            userId: user._id,
            name: user.name,
            employeeId: user.employeeId,
            role: user.role,
            status: 'failed',
            error: errorMessage
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
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      // บันทึก error log
      await this.logAutoCheckoutExecution([], 'scheduled', errorMessage);
    }
  }

  /**
   * บันทึกประวัติการดำเนินการ Auto Checkout
   */
  private async logAutoCheckoutExecution(
    results: AutoCheckoutResult[], 
    executionType: 'manual' | 'scheduled', 
    errorMessage?: string
  ): Promise<void> {
    try {
      const AutoCheckoutLogModel = mongoose.models.AutoCheckoutLog || 
                                  mongoose.model('AutoCheckoutLog', AutoCheckoutLogSchema);

      const successfulCheckouts = results.filter(r => r.status === 'success');
      const failedCheckouts = results.filter(r => r.status === 'failed');

      const logEntry: AutoCheckoutLogEntry = {
        executedAt: new Date(),
        totalUsers: results.length,
        successfulCheckouts: successfulCheckouts.length,
        failedCheckouts: failedCheckouts.length,
        details: results,
        executionType,
        errorMessage
      };

      await AutoCheckoutLogModel.create(logEntry);
    } catch (logError) {
      console.error('Failed to log auto checkout execution:', logError);
    }
  }

  /**
   * อัพเดทข้อมูลการดำเนินการล่าสุด
   */
  private async updateLastRunInfo(lastRun: Date, affectedUsers: number): Promise<void> {
    try {
      const AutoCheckoutSettingsModel = mongoose.models.AutoCheckoutSettings;
      
      if (AutoCheckoutSettingsModel) {
        await AutoCheckoutSettingsModel.findOneAndUpdate(
          {},
          { 
            $set: { 
              lastRun,
              affectedUsers,
              updatedAt: new Date()
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
  private stopSchedule(): void {
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
  async updateSchedule(): Promise<void> {
    console.log('Updating auto checkout schedule...');
    await this.loadAndSchedule();
  }

  /**
   * ปิดการทำงานของ scheduler
   */
  destroy(): void {
    this.stopSchedule();
    this.isInitialized = false;
    console.log('Auto Checkout Scheduler destroyed');
  }

  /**
   * Get current status for debugging
   */
  getStatus(): { isInitialized: boolean; hasScheduledTask: boolean } {
    return {
      isInitialized: this.isInitialized,
      hasScheduledTask: this.scheduledTask !== null
    };
  }
}

// สร้าง instance เดียวสำหรับใช้งานทั้งแอป
const autoCheckoutScheduler = new AutoCheckoutScheduler();

export default autoCheckoutScheduler;

// ฟังก์ชันเริ่มต้นระบบ (เรียกใน app startup)
export const initializeAutoCheckout = async (): Promise<void> => {
  await autoCheckoutScheduler.initialize();
};

// ฟังก์ชันอัพเดท schedule (เรียกจาก API)
export const updateAutoCheckoutSchedule = async (): Promise<void> => {
  await autoCheckoutScheduler.updateSchedule();
};

// Export types for use in other files
export type { AutoCheckoutSettings, AutoCheckoutResult, AutoCheckoutLogEntry };