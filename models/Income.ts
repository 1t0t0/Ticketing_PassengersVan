// models/Income.ts - Updated with revenue calculation methods
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IIncome extends Document {
  income_id: string;
  ticket_id: mongoose.Schema.Types.ObjectId | string;
  user_id: mongoose.Schema.Types.ObjectId | string;
  income_amount: number;
  income_date: Date;
  revenue_share_type: 'company' | 'station' | 'driver';
  created_at: Date;
  updated_at: Date;
}

const incomeSchema = new Schema({
  income_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  ticket_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket',
    required: true
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  income_amount: { 
    type: Number, 
    required: true 
  },
  income_date: { 
    type: Date,
    default: Date.now
  },
  revenue_share_type: {
    type: String,
    enum: ['company', 'station', 'driver'],
    required: true
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// สัดส่วนการแบ่งรายได้
const REVENUE_SHARE = {
  COMPANY: 0.10,    // 10%
  STATION: 0.05,    // 5%
  DRIVERS: 0.85     // 85%
};

// Static method: สร้าง Income records จาก Ticket
incomeSchema.statics.createFromTicket = async function(ticketId: string, ticketPrice: number, driverId: string, stationId?: string) {
  const incomes = [];
  
  // คำนวณส่วนแบ่งรายได้
  const companyShare = Math.round(ticketPrice * REVENUE_SHARE.COMPANY);
  const stationShare = Math.round(ticketPrice * REVENUE_SHARE.STATION);
  const driverShare = Math.round(ticketPrice * REVENUE_SHARE.DRIVERS);
  
  const timestamp = Date.now();
  
  // สร้าง Income record สำหรับบริษัท
  incomes.push({
    income_id: `INC-COMPANY-${timestamp}-1`,
    ticket_id: ticketId,
    user_id: null, // บริษัทไม่มี user_id เฉพาะ
    income_amount: companyShare,
    revenue_share_type: 'company',
    income_date: new Date()
  });
  
  // สร้าง Income record สำหรับสถานี
  if (stationId) {
    incomes.push({
      income_id: `INC-STATION-${timestamp}-2`,
      ticket_id: ticketId,
      user_id: stationId,
      income_amount: stationShare,
      revenue_share_type: 'station',
      income_date: new Date()
    });
  }
  
  // สร้าง Income record สำหรับคนขับ
  incomes.push({
    income_id: `INC-DRIVER-${timestamp}-3`,
    ticket_id: ticketId,
    user_id: driverId,
    income_amount: driverShare,
    revenue_share_type: 'driver',
    income_date: new Date()
  });
  
  // บันทึกลงฐานข้อมูล
  return await this.insertMany(incomes);
};

// Static method: หารายได้ตาม ticket ID
incomeSchema.statics.findByTicketId = function(ticketId: string) {
  return this.find({ ticket_id: ticketId }).exec();
};

// Static method: หารายได้ของผู้ใช้ตาม user ID และประเภท
incomeSchema.statics.findByUserIdAndType = function(userId: string, shareType: string) {
  return this.find({ user_id: userId, revenue_share_type: shareType }).sort({ income_date: -1 }).exec();
};

// Static method: หารายได้ในช่วงวันที่
incomeSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, shareType?: string) {
  const query: any = {
    income_date: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (shareType) {
    query.revenue_share_type = shareType;
  }
  
  return this.find(query).sort({ income_date: -1 }).exec();
};

// Static method: สรุปรายได้รายวันตามประเภท
incomeSchema.statics.getDailyIncomeByType = async function(date: Date, shareType: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await this.aggregate([
    {
      $match: {
        revenue_share_type: shareType,
        income_date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$income_amount" },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { totalAmount: 0, transactionCount: 0 };
};

// Static method: สรุปรายได้รายเดือนของคนขับ
incomeSchema.statics.getDriverMonthlyIncome = async function(userId: string, year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  
  const result = await this.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        revenue_share_type: 'driver',
        income_date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$income_date" },
        date: { $first: "$income_date" },
        totalAmount: { $sum: "$income_amount" },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return result;
};

// Static method: คำนวณรายได้ทั้งหมดตามประเภท
incomeSchema.statics.getTotalIncomeByType = async function(shareType: string, startDate?: Date, endDate?: Date) {
  const matchQuery: any = { revenue_share_type: shareType };
  
  if (startDate && endDate) {
    matchQuery.income_date = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  const result = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$income_amount" },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { totalAmount: 0, transactionCount: 0 };
};

// Handle the case where this model might be compiled multiple times
const Income: Model<IIncome> = mongoose.models.Income || mongoose.model<IIncome>('Income', incomeSchema);

export default Income;