// models/BookingTicket.ts - โมเดลสำหรับตั๋วแต่ละใบในการจอง
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBookingTicket extends Document {
  booking_id: mongoose.Schema.Types.ObjectId;  // อ้างอิง Booking
  ticket_code: string;          // BK-250611-001-P1, BK-250611-001-P2, etc.
  passenger_order: number;      // ลำดับผู้โดยสาร (1, 2, 3...)
  passenger_email: string;      // Email ผู้โดยสารคนนี้
  qr_code_data: string;         // ข้อมูล QR Code ในรูปแบบ JSON string
  qr_code_image?: string;       // URL รูป QR Code (optional - อาจจะ generate on-demand)
  status: 'issued' | 'used' | 'expired' | 'cancelled';
  
  // ข้อมูลการใช้งาน
  used_by?: mongoose.Schema.Types.ObjectId;    // Driver ที่สแกน
  used_at?: Date;              // เวลาที่สแกน
  scanned_location?: {         // ตำแหน่งที่สแกน (optional)
    latitude: number;
    longitude: number;
  };
  
  // ข้อมูลการหมดอายุ
  valid_from: Date;            // เริ่มใช้งานได้ตั้งแต่เมื่อไหร่
  valid_until: Date;           // หมดอายุเมื่อไหร่
  
  // Email tracking
  email_sent: boolean;         // ส่ง Email แล้วหรือยัง
  email_sent_at?: Date;        // เวลาที่ส่ง Email
  email_error?: string;        // Error ของการส่ง Email (ถ้ามี)
  
  created_at: Date;
  updated_at: Date;
}

const bookingTicketSchema = new Schema({
  booking_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking',
    required: true,
    index: true
  },
  ticket_code: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  passenger_order: { 
    type: Number, 
    required: true,
    min: 1
  },
  passenger_email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  qr_code_data: { 
    type: String, 
    required: true
  },
  qr_code_image: String,  // URL รูป QR Code
  status: { 
    type: String, 
    enum: ['issued', 'used', 'expired', 'cancelled'],
    default: 'issued',
    index: true
  },
  
  // การใช้งาน
  used_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'  // Driver
  },
  used_at: Date,
  scanned_location: {
    latitude: Number,
    longitude: Number
  },
  
  // วันที่มีผล
  valid_from: { 
    type: Date, 
    required: true 
  },
  valid_until: { 
    type: Date, 
    required: true,
    index: true
  },
  
  // Email tracking
  email_sent: { 
    type: Boolean, 
    default: false 
  },
  email_sent_at: Date,
  email_error: String
  
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Composite Indexes
bookingTicketSchema.index({ booking_id: 1, passenger_order: 1 }, { unique: true });
bookingTicketSchema.index({ status: 1, valid_until: 1 });
bookingTicketSchema.index({ passenger_email: 1, status: 1 });
bookingTicketSchema.index({ used_by: 1, used_at: -1 });

// Static Methods

// สร้าง ticket code
bookingTicketSchema.statics.generateTicketCode = function(bookingId: string, passengerOrder: number): string {
  return `${bookingId}-P${passengerOrder}`;
};

// สร้างตั๋วทั้งหมดสำหรับการจอง
bookingTicketSchema.statics.createTicketsForBooking = async function(booking: any): Promise<any[]> {
  const tickets = [];
  
  for (let i = 0; i < booking.total_tickets; i++) {
    const passengerOrder = i + 1;
    const ticketCode = this.generateTicketCode(booking.booking_id, passengerOrder);
    
    // คำนวณวันที่มีผล
    const travelDate = new Date(booking.travel_date + 'T00:00:00.000Z');
    const validFrom = new Date(travelDate);
    validFrom.setHours(0, 0, 0, 0);  // เริ่มต้นวัน
    
    const validUntil = new Date(travelDate);
    validUntil.setHours(23, 59, 59, 999);  // สิ้นสุดวัน
    
    // สร้างข้อมูล QR Code
    const qrData = {
      booking_id: booking.booking_id,
      ticket_code: ticketCode,
      passenger_order: passengerOrder,
      passenger_email: booking.passenger_emails[i],
      travel_date: booking.travel_date,
      total_passengers: booking.total_tickets,
      price: booking.price_per_ticket,
      validation_key: `BT-${ticketCode}-${travelDate.getTime()}`,
      expires_at: validUntil.toISOString(),
      type: 'booking_ticket'
    };
    
    const ticket = {
      booking_id: booking._id,
      ticket_code: ticketCode,
      passenger_order: passengerOrder,
      passenger_email: booking.passenger_emails[i],
      qr_code_data: JSON.stringify(qrData),
      valid_from: validFrom,
      valid_until: validUntil,
      status: 'issued'
    };
    
    tickets.push(ticket);
  }
  
  return await this.insertMany(tickets);
};

// ค้นหาตั๋วจากการจอง
bookingTicketSchema.statics.findByBookingId = function(bookingId: string) {
  return this.find({ booking_id: bookingId })
    .populate('booking_id', 'booking_id travel_date status')
    .populate('used_by', 'name employeeId')
    .sort({ passenger_order: 1 });
};

// ค้นหาตั๋วที่พร้อมใช้งาน
bookingTicketSchema.statics.findUsableTickets = function(email: string) {
  return this.find({
    passenger_email: email.toLowerCase(),
    status: 'issued',
    valid_from: { $lte: new Date() },
    valid_until: { $gte: new Date() }
  })
  .populate('booking_id', 'booking_id travel_date total_tickets')
  .sort({ valid_from: 1 });
};

// ค้นหาตั๋วที่หมดอายุ
bookingTicketSchema.statics.findExpiredTickets = function() {
  return this.find({
    status: 'issued',
    valid_until: { $lt: new Date() }
  });
};

// สถิติการใช้งานตั๋วจอง
bookingTicketSchema.statics.getUsageStats = async function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        used_at: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$used_at" } },
          driver: "$used_by"
        },
        ticketsScanned: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.driver',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    },
    {
      $group: {
        _id: "$_id.date",
        drivers: {
          $push: {
            driver_id: "$driver._id",
            driver_name: "$driver.name",
            employee_id: "$driver.employeeId",
            tickets_scanned: "$ticketsScanned"
          }
        },
        total_scanned: { $sum: "$ticketsScanned" }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Instance Methods

// ตรวจสอบว่าตั๋วใช้งานได้หรือไม่
bookingTicketSchema.methods.isUsable = function(): boolean {
  const now = new Date();
  return this.status === 'issued' && 
         this.valid_from <= now && 
         this.valid_until >= now;
};

// ตรวจสอบว่าหมดอายุหรือไม่
bookingTicketSchema.methods.isExpired = function(): boolean {
  return new Date() > this.valid_until;
};

// ตรวจสอบว่าสามารถสแกนได้หรือไม่
bookingTicketSchema.methods.canScan = function(): boolean {
  return this.isUsable() && this.status === 'issued';
};

// สแกนตั๋ว
bookingTicketSchema.methods.scanTicket = async function(driverId: string, location?: {latitude: number, longitude: number}) {
  if (!this.canScan()) {
    throw new Error('ตั๋วนี้ไม่สามารถใช้งานได้');
  }
  
  this.status = 'used';
  this.used_by = driverId;
  this.used_at = new Date();
  
  if (location) {
    this.scanned_location = location;
  }
  
  return await this.save();
};

// อัปเดทสถานะการส่ง Email
bookingTicketSchema.methods.markEmailSent = async function(success: boolean, error?: string) {
  this.email_sent = success;
  this.email_sent_at = new Date();
  
  if (!success && error) {
    this.email_error = error;
  }
  
  return await this.save();
};

// ดึงข้อมูล QR Code ที่ parse แล้ว
bookingTicketSchema.methods.getParsedQRData = function() {
  try {
    return JSON.parse(this.qr_code_data);
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

// Virtual fields
bookingTicketSchema.virtual('statusText').get(function() {
  const statusMap = {
    'issued': 'ออกตั๋วแล้ว',
    'used': 'ใช้งานแล้ว',
    'expired': 'หมดอายุ',
    'cancelled': 'ยกเลิกแล้ว'
  };
  return statusMap[this.status] || this.status;
});

bookingTicketSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'issued') return 0;
  return Math.max(0, this.valid_until.getTime() - new Date().getTime());
});

// Pre-save middleware
bookingTicketSchema.pre('save', function(next) {
  // ตรวจสอบว่า valid_until มาหลัง valid_from
  if (this.valid_until <= this.valid_from) {
    return next(new Error('Valid until must be after valid from'));
  }
  
  // อัปเดทสถานะเป็น expired ถ้าหมดอายุแล้ว
  if (this.status === 'issued' && this.isExpired()) {
    this.status = 'expired';
  }
  
  next();
});

// Ensure virtual fields are serialized
bookingTicketSchema.set('toJSON', { virtuals: true });
bookingTicketSchema.set('toObject', { virtuals: true });

// Handle multiple model compilation
const BookingTicket: Model<IBookingTicket> = mongoose.models.BookingTicket || 
  mongoose.model<IBookingTicket>('BookingTicket', bookingTicketSchema);

export default BookingTicket;