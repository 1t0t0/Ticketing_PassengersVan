// models/Income.ts - Enhanced with individual driver revenue tracking
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IIncome extends Document {
  income_id: string;
  ticket_id: mongoose.Schema.Types.ObjectId | string;
  user_id: mongoose.Schema.Types.ObjectId | string;
  driver_id?: mongoose.Schema.Types.ObjectId | string; // เพิ่มฟิลด์สำหรับระบุคนขับที่ควรได้รับส่วนแบ่ง
  income_amount: number;
  income_date: Date;
  revenue_share_type: 'company' | 'station' | 'driver';
  distribution_date?: Date; // วันที่แบ่งรายได้จริง
  is_distributed?: boolean; // สถานะการแบ่งรายได้แล้วหรือยัง
  working_drivers_count?: number; // จำนวนคนขับที่เข้าทำงานในวันนั้น
  individual_driver_share?: number; // ส่วนแบ่งที่คนขับแต่ละคนควรได้
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
  driver_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // คนขับที่ควรได้รับส่วนแบ่งจากตั๋วใบนี้
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
  },
  distribution_date: { 
    type: Date 
  },
  is_distributed: { 
    type: Boolean, 
    default: false 
  },
  working_drivers_count: { 
    type: Number 
  },
  individual_driver_share: { 
    type: Number 
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

// Indexes for performance
incomeSchema.index({ income_date: 1, revenue_share_type: 1 });
incomeSchema.index({ driver_id: 1, income_date: 1 });
incomeSchema.index({ user_id: 1, revenue_share_type: 1 });
incomeSchema.index({ is_distributed: 1 });

// Static method: สร้าง Income records จาก Ticket พร้อมเชื่อมโยงคนขับที่เข้าทำงาน
incomeSchema.statics.createFromTicketWithWorkingDrivers = async function(
  ticketId: string, 
  ticketPrice: number, 
  soldBy: string,
  stationId?: string
) {
  const incomes = [];
  const timestamp = Date.now();
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  // หาคนขับที่เข้าทำงานในวันนี้
  const User = mongoose.model('User');
  const workingDrivers = await User.find({
    role: 'driver',
    checkInStatus: 'checked-in'
  });
  
  console.log(`Working drivers today: ${workingDrivers.length}`);
  
  // คำนวณส่วนแบ่งรายได้
  const companyShare = Math.round(ticketPrice * REVENUE_SHARE.COMPANY);
  const stationShare = Math.round(ticketPrice * REVENUE_SHARE.STATION);
  const driverShare = Math.round(ticketPrice * REVENUE_SHARE.DRIVERS);
  
  // คำนวณส่วนแบ่งต่อคนขับ (85% หารด้วยจำนวนคนขับที่เข้าทำงาน)
  const individualDriverShare = workingDrivers.length > 0 
    ? Math.round(driverShare / workingDrivers.length) 
    : 0;
  
  // สร้าง Income record สำหรับบริษัท
  incomes.push({
    income_id: `INC-COMPANY-${timestamp}-1`,
    ticket_id: ticketId,
    user_id: null,
    income_amount: companyShare,
    revenue_share_type: 'company',
    income_date: today,
    working_drivers_count: workingDrivers.length,
    is_distributed: true
  });
  
  // สร้าง Income record สำหรับสถานี
  if (stationId) {
    incomes.push({
      income_id: `INC-STATION-${timestamp}-2`,
      ticket_id: ticketId,
      user_id: stationId,
      income_amount: stationShare,
      revenue_share_type: 'station',
      income_date: today,
      working_drivers_count: workingDrivers.length,
      is_distributed: true
    });
  }
  
  // สร้าง Income record สำหรับคนขับแต่ละคน
  workingDrivers.forEach((driver, index) => {
    incomes.push({
      income_id: `INC-DRIVER-${timestamp}-${index + 3}`,
      ticket_id: ticketId,
      user_id: driver._id,
      driver_id: driver._id,
      income_amount: individualDriverShare,
      revenue_share_type: 'driver',
      income_date: today,
      working_drivers_count: workingDrivers.length,
      individual_driver_share: individualDriverShare,
      is_distributed: false // จะต้องแบ่งจ่ายในภายหลัง
    });
  });
  
  // บันทึกลงฐานข้อมูล
  return await this.insertMany(incomes);
};

// Static method: คำนวณรายได้รายวันของคนขับ
incomeSchema.statics.getDriverDailyIncome = async function(driverId: string, date: string) {
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');
  
  const result = await this.aggregate([
    {
      $match: {
        driver_id: new mongoose.Types.ObjectId(driverId),
        revenue_share_type: 'driver',
        income_date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: '$income_amount' },
        ticketCount: { $sum: 1 },
        averageShare: { $avg: '$individual_driver_share' },
        workingDriversCount: { $first: '$working_drivers_count' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : {
    totalIncome: 0,
    ticketCount: 0,
    averageShare: 0,
    workingDriversCount: 0
  };
};

// Static method: ดึงรายได้รายวันของคนขับทุกคน
incomeSchema.statics.getAllDriversDailyIncome = async function(date: string) {
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');
  
  const result = await this.aggregate([
    {
      $match: {
        revenue_share_type: 'driver',
        income_date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: '$driver_id',
        totalIncome: { $sum: '$income_amount' },
        ticketCount: { $sum: 1 },
        averageShare: { $avg: '$individual_driver_share' },
        workingDriversCount: { $first: '$working_drivers_count' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    },
    {
      $project: {
        driverId: '$_id',
        driver: {
          _id: '$driver._id',
          name: '$driver.name',
          employeeId: '$driver.employeeId',
          checkInStatus: '$driver.checkInStatus'
        },
        totalIncome: 1,
        ticketCount: 1,
        averageShare: 1,
        workingDriversCount: 1
      }
    },
    {
      $sort: { totalIncome: -1 }
    }
  ]);
  
  return result;
};

// Static method: คำนวณรายได้รายเดือนของคนขับ
incomeSchema.statics.getDriverMonthlyIncome = async function(driverId: string, year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  
  const result = await this.aggregate([
    {
      $match: {
        driver_id: new mongoose.Types.ObjectId(driverId),
        revenue_share_type: 'driver',
        income_date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $group: {
        _id: { 
          year: { $year: '$income_date' },
          month: { $month: '$income_date' },
          day: { $dayOfMonth: '$income_date' }
        },
        date: { $first: '$income_date' },
        totalIncome: { $sum: '$income_amount' },
        ticketCount: { $sum: 1 },
        workingDriversCount: { $first: '$working_drivers_count' }
      }
    },
    {
      $sort: { '_id.day': 1 }
    }
  ]);
  
  return result;
};

// Static method: อัพเดทสถานะการแบ่งรายได้
incomeSchema.statics.markAsDistributed = async function(incomeIds: string[]) {
  return await this.updateMany(
    { _id: { $in: incomeIds } },
    { 
      $set: { 
        is_distributed: true,
        distribution_date: new Date()
      }
    }
  );
};

// Static method: ดึงรายได้ที่ยังไม่ได้แบ่งจ่าย
incomeSchema.statics.getUndistributedIncome = async function(driverId?: string) {
  const query: any = {
    revenue_share_type: 'driver',
    is_distributed: false
  };
  
  if (driverId) {
    query.driver_id = new mongoose.Types.ObjectId(driverId);
  }
  
  return await this.find(query)
    .populate('driver_id', 'name employeeId')
    .populate('ticket_id', 'ticketNumber price')
    .sort({ income_date: -1 });
};

// Static method: สรุปรายได้รายวันแบบรวม
incomeSchema.statics.getDailyRevenueSummary = async function(date: string) {
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');
  
  const result = await this.aggregate([
    {
      $match: {
        income_date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: '$revenue_share_type',
        totalAmount: { $sum: '$income_amount' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  // จัดรูปแบบผลลัพธ์
  const summary = {
    company: { totalAmount: 0, transactionCount: 0 },
    station: { totalAmount: 0, transactionCount: 0 },
    driver: { totalAmount: 0, transactionCount: 0 }
  };
  
  result.forEach(item => {
    summary[item._id as keyof typeof summary] = {
      totalAmount: item.totalAmount,
      transactionCount: item.transactionCount
    };
  });
  
  return summary;
};

// Handle the case where this model might be compiled multiple times
const Income: Model<IIncome> = mongoose.models.Income || mongoose.model<IIncome>('Income', incomeSchema);

export default Income;