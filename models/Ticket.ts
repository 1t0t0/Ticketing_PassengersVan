// models/Ticket.ts - Enhanced with Group Ticket Support
import mongoose, { Document, Model } from 'mongoose';

export interface ITicketDocument extends Document {
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date;
  
  // ✅ เพิ่มฟิลด์สำหรับ Group Ticket Support
  ticketType: 'individual' | 'group';
  passengerCount: number;        // จำนวนผู้โดยสาร
  pricePerPerson: number;        // ราคาต่อคน
}

const ticketSchema = new mongoose.Schema({
  ticketNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  soldBy: { 
    type: String, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['cash', 'card', 'qr'] 
  },
  soldAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // ✅ เพิ่มฟิลด์สำหรับ Group Ticket
  ticketType: {
    type: String,
    enum: ['individual', 'group'],
    default: 'individual',
    required: true
  },
  passengerCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
    required: true
  },
  pricePerPerson: {
    type: Number,
    required: true,
    default: 45000
  }
});

// ✅ เพิ่ม Indexes สำหรับการค้นหา
ticketSchema.index({ ticketType: 1 });
ticketSchema.index({ passengerCount: 1 });
ticketSchema.index({ soldAt: -1, ticketType: 1 });

// ✅ เพิ่ม Virtual Fields
ticketSchema.virtual('isGroupTicket').get(function() {
  return this.ticketType === 'group';
});

ticketSchema.virtual('totalPassengers').get(function() {
  return this.passengerCount;
});

// ✅ เพิ่ม Static Methods
ticketSchema.statics.findGroupTickets = function(filter = {}) {
  return this.find({
    ticketType: 'group',
    ...filter
  });
};

ticketSchema.statics.findIndividualTickets = function(filter = {}) {
  return this.find({
    ticketType: 'individual',
    ...filter
  });
};

// ✅ เพิ่ม Static Method: สถิติตั๋วกลุ่ม
ticketSchema.statics.getGroupTicketStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = { ticketType: 'group' };
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalGroupTickets: { $sum: 1 },
        totalPassengers: { $sum: '$passengerCount' },
        totalRevenue: { $sum: '$price' },
        avgPassengersPerGroup: { $avg: '$passengerCount' },
        minGroupSize: { $min: '$passengerCount' },
        maxGroupSize: { $max: '$passengerCount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalGroupTickets: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    avgPassengersPerGroup: 0,
    minGroupSize: 0,
    maxGroupSize: 0
  };
};

// ✅ เพิ่ม Static Method: สถิติรวม Individual + Group
ticketSchema.statics.getComprehensiveStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = {};
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$ticketType',
        ticketCount: { $sum: 1 },
        totalPassengers: { $sum: '$passengerCount' },
        totalRevenue: { $sum: '$price' }
      }
    }
  ]);
  
  const result = {
    individual: { ticketCount: 0, totalPassengers: 0, totalRevenue: 0 },
    group: { ticketCount: 0, totalPassengers: 0, totalRevenue: 0 },
    total: { ticketCount: 0, totalPassengers: 0, totalRevenue: 0 }
  };
  
  stats.forEach(stat => {
    result[stat._id as keyof typeof result] = {
      ticketCount: stat.ticketCount,
      totalPassengers: stat.totalPassengers,
      totalRevenue: stat.totalRevenue
    };
  });
  
  // คำนวณรวม
  result.total = {
    ticketCount: result.individual.ticketCount + result.group.ticketCount,
    totalPassengers: result.individual.totalPassengers + result.group.totalPassengers,
    totalRevenue: result.individual.totalRevenue + result.group.totalRevenue
  };
  
  return result;
};

// ✅ Pre-save middleware: ตรวจสอบความถูกต้องของข้อมูล
ticketSchema.pre('save', function(next) {
  // ตรวจสอบว่า price = pricePerPerson * passengerCount
  const expectedPrice = this.pricePerPerson * this.passengerCount;
  if (this.price !== expectedPrice) {
    this.price = expectedPrice;
  }
  
  // ตรวจสอบ passengerCount สำหรับ group ticket
  if (this.ticketType === 'group' && this.passengerCount < 2) {
    return next(new Error('Group ticket must have at least 2 passengers'));
  }
  
  if (this.ticketType === 'individual' && this.passengerCount !== 1) {
    this.passengerCount = 1;
  }
  
  next();
});

// Ensure virtual fields are serialized
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

const Ticket: Model<ITicketDocument> = mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', ticketSchema);

export default Ticket;