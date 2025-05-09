// models/Income.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IIncome extends Document {
  income_id: string;
  ticket_id: mongoose.Schema.Types.ObjectId | string;
  user_id: mongoose.Schema.Types.ObjectId | string;
  income_amount: number;
  income_date: Date;
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
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Static method: หารายได้ตาม ticket ID
incomeSchema.statics.findByTicketId = function(ticketId: string) {
  return this.findOne({ ticket_id: ticketId }).exec();
};

// Static method: หารายได้ของคนขับ
incomeSchema.statics.findByUserId = function(userId: string) {
  return this.find({ user_id: userId }).sort({ income_date: -1 }).exec();
};

// Static method: หารายได้ของคนขับในช่วงวันที่
incomeSchema.statics.findByUserIdAndDateRange = function(userId: string, startDate: Date, endDate: Date) {
  return this.find({
    user_id: userId,
    income_date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ income_date: -1 }).exec();
};

// Static method: สรุปรายได้ของคนขับรายวัน
incomeSchema.statics.getDailyIncome = async function(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await this.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
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
        ticketCount: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { totalAmount: 0, ticketCount: 0 };
};

// Static method: สรุปรายได้ของคนขับรายเดือน
incomeSchema.statics.getMonthlyIncome = async function(userId: string, year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  
  const result = await this.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
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
        ticketCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return result;
};

// Handle the case where this model might be compiled multiple times
const Income: Model<IIncome> = mongoose.models.Income || mongoose.model<IIncome>('Income', incomeSchema);

export default Income;