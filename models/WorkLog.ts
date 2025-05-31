// models/WorkLog.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWorkLog extends Document {
  user_id: mongoose.Schema.Types.ObjectId | string;
  action: 'check-in' | 'check-out';
  timestamp: Date;
  date: string; // YYYY-MM-DD format for easy querying
  created_at: Date;
  updated_at: Date;
}

const workLogSchema = new Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  action: { 
    type: String, 
    enum: ['check-in', 'check-out'],
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Create indexes for efficient queries
workLogSchema.index({ user_id: 1, date: 1 });
workLogSchema.index({ user_id: 1, timestamp: -1 });
workLogSchema.index({ date: 1 });
workLogSchema.index({ action: 1 });

// Static method: บันทึก check-in/check-out
workLogSchema.statics.logWorkAction = async function(userId: string, action: 'check-in' | 'check-out') {
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const workLog = new this({
    user_id: userId,
    action: action,
    timestamp: now,
    date: dateString
  });
  
  return await workLog.save();
};

// Static method: ดึงประวัติการเข้างานของผู้ใช้ในวันที่กำหนด
workLogSchema.statics.getUserWorkLogsForDate = function(userId: string, date: string) {
  return this.find({ 
    user_id: userId, 
    date: date 
  }).sort({ timestamp: 1 });
};

// Static method: ดึงประวัติการเข้างานของผู้ใช้ในช่วงวันที่
workLogSchema.statics.getUserWorkLogsForDateRange = function(userId: string, startDate: string, endDate: string) {
  return this.find({ 
    user_id: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

// Static method: ดึงประวัติการเข้างานล่าสุดของผู้ใช้
workLogSchema.statics.getLatestWorkLogs = function(userId: string, limit: number = 10) {
  return this.find({ user_id: userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method: ดึงสถิติการเข้างานของผู้ใช้ในเดือนที่กำหนด
workLogSchema.statics.getUserMonthlyStats = async function(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const startDateString = startDate.toISOString().split('T')[0];
  const endDateString = endDate.toISOString().split('T')[0];
  
  const logs = await this.find({
    user_id: userId,
    date: { $gte: startDateString, $lte: endDateString }
  }).sort({ timestamp: 1 });
  
  // จัดกลุ่มตามวันที่
  const dailyLogs: { [date: string]: any[] } = {};
  logs.forEach((log: any) => {
    if (!dailyLogs[log.date]) {
      dailyLogs[log.date] = [];
    }
    dailyLogs[log.date].push(log);
  });
  
  return {
    totalDays: Object.keys(dailyLogs).length,
    dailyLogs: dailyLogs,
    logs: logs
  };
};

// Static method: ดึงสถิติการเข้างานของทุกคนในวันที่กำหนด
workLogSchema.statics.getDailyAttendanceStats = async function(date: string) {
  const stats = await this.aggregate([
    { $match: { date: date } },
    {
      $group: {
        _id: { user_id: '$user_id', action: '$action' },
        count: { $sum: 1 },
        latestTime: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.user_id',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            latestTime: '$latestTime'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user: {
          _id: '$user._id',
          name: '$user.name',
          employeeId: '$user.employeeId',
          role: '$user.role'
        },
        actions: 1
      }
    }
  ]);
  
  return stats;
};

// Virtual field: ฟอร์แมตเวลาเป็นภาษาลาว
workLogSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleString('lo-LA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Virtual field: แสดงข้อความการกระทำเป็นภาษาลาว
workLogSchema.virtual('actionText').get(function() {
  return this.action === 'check-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ';
});

// Ensure virtual fields are serialized
workLogSchema.set('toJSON', { virtuals: true });
workLogSchema.set('toObject', { virtuals: true });

// Pre-save middleware: ตั้งค่า date field อัตโนมัติ
workLogSchema.pre('save', function(next) {
  if (!this.date && this.timestamp) {
    this.date = this.timestamp.toISOString().split('T')[0];
  }
  next();
});

// Handle the case where this model might be compiled multiple times
const WorkLog: Model<IWorkLog> = mongoose.models.WorkLog || mongoose.model<IWorkLog>('WorkLog', workLogSchema);

export default WorkLog;