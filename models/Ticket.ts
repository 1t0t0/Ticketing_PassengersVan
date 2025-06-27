// models/Ticket.ts - Enhanced with Destination Support
import mongoose, { Document, Model } from 'mongoose';

export interface ITicketDocument extends Document {
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date;
  
  // Group Ticket Support
  ticketType: 'individual' | 'group';
  passengerCount: number;        // จำนวนผู้โดยสาร
  pricePerPerson: number;        // ราคาต่อคน
  
  // ✅ เพิ่มฟิลด์ปลายทาง
  destination?: string;          // ปลายทาง (ไม่บังคับ)
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
  
  // Group Ticket fields
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
    default: 4500
  },
  
  // ✅ เพิ่มฟิลด์ปลายทาง
  destination: {
    type: String,
    trim: true,
    maxlength: 100,        // จำกัดความยาวสูงสุด 100 ตัวอักษร
    default: 'ຕົວເມືອງ'    // ค่าเริ่มต้น
  }
});

// Indexes สำหรับการค้นหา
ticketSchema.index({ ticketType: 1 });
ticketSchema.index({ passengerCount: 1 });
ticketSchema.index({ soldAt: -1, ticketType: 1 });
ticketSchema.index({ destination: 1 }); // ✅ เพิ่ม index สำหรับปลายทาง

// Virtual Fields
ticketSchema.virtual('isGroupTicket').get(function() {
  return this.ticketType === 'group';
});

ticketSchema.virtual('totalPassengers').get(function() {
  return this.passengerCount;
});

// ✅ เพิ่ม Virtual Field สำหรับ route information
ticketSchema.virtual('routeInfo').get(function() {
  return {
    origin: 'ສະຖານີລົດໄຟ',
    destination: this.destination || 'ຕົວເມືອງ',
    fullRoute: `ສະຖານີລົດໄຟ → ${this.destination || 'ຕົວເມືອງ'}`
  };
});

// Static Methods
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

// ✅ เพิ่ม Static Method: ค้นหาตั๋วตามปลายทาง
ticketSchema.statics.findByDestination = function(destination: string, filter = {}) {
  return this.find({
    destination: new RegExp(destination, 'i'), // ค้นหาแบบไม่สนใจตัวพิมพ์ใหญ่เล็ก
    ...filter
  });
};

// ✅ เพิ่ม Static Method: สถิติปลายทาง
ticketSchema.statics.getDestinationStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = {};
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$destination',
        ticketCount: { $sum: 1 },
        totalPassengers: { $sum: '$passengerCount' },
        totalRevenue: { $sum: '$price' }
      }
    },
    {
      $sort: { ticketCount: -1 }
    }
  ]);
  
  return stats;
};

// สถิติตั๋วกลุ่ม
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

// สถิติรวม Individual + Group + Destination
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

// Pre-save middleware: ตรวจสอบความถูกต้องของข้อมูล
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
  
  // ✅ ตรวจสอบและทำความสะอาดปลายทาง
  if (this.destination) {
    this.destination = this.destination.trim();
    // ถ้าปลายทางว่างหลังจาก trim ให้ใช้ค่าเริ่มต้น
    if (!this.destination) {
      this.destination = 'ຕົວເມືອງ';
    }
  } else {
    this.destination = 'ຕົວເມືອງ';
  }
  
  next();
});

// Ensure virtual fields are serialized
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

const Ticket: Model<ITicketDocument> = mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', ticketSchema);

export default Ticket;