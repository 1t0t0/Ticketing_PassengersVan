// models/Booking.ts - โมเดลสำหรับการจองตั๋ว
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBooking extends Document {
  booking_id: string;           // BK-YYMMDD-XXX
  booking_date: Date;           // วันที่ทำการจอง
  travel_date: string;          // วันที่เดินทาง (YYYY-MM-DD)
  total_tickets: number;        // จำนวนตั๋วรวม
  total_price: number;          // ราคารวมทั้งหมด
  price_per_ticket: number;     // ราคาต่อใบ
  payment_slip?: string;        // URL รูปสลิปการโอน (Cloudinary)
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  booker_email: string;         // Email ผู้ทำการจอง
  booker_name?: string;         // ชื่อผู้ทำการจอง (optional)
  booker_phone?: string;        // เบอร์โทรผู้ทำการจอง (optional)
  passenger_emails: string[];   // Email ผู้โดยสารทั้งหมด
  approved_by?: mongoose.Schema.Types.ObjectId;  // Admin ที่อนุมัติ
  approved_at?: Date;           // วันเวลาที่อนุมัติ
  cancelled_at?: Date;          // วันเวลาที่ยกเลิก
  cancel_reason?: string;       // เหตุผลการยกเลิก
  admin_notes?: string;         // หมายเหตุจาก Admin
  expires_at: Date;             // หมดเวลาตรวจสอบ (24 ชม. หลังอัปโหลดสลิป)
  created_at: Date;
  updated_at: Date;
}

const bookingSchema = new Schema({
  booking_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  booking_date: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  travel_date: { 
    type: String, 
    required: true,
    index: true
  },
  total_tickets: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10  // จำกัดสูงสุด 10 ตั๋วต่อการจอง
  },
  total_price: { 
    type: Number, 
    required: true,
    min: 0
  },
  price_per_ticket: { 
    type: Number, 
    required: true,
    min: 0
  },
  payment_slip: { 
    type: String  // URL จาก Cloudinary
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  booker_email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  booker_name: { 
    type: String,
    trim: true
  },
  booker_phone: { 
    type: String,
    trim: true
  },
  passenger_emails: [{ 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  }],
  approved_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  approved_at: Date,
  cancelled_at: Date,
  cancel_reason: String,
  admin_notes: String,
  expires_at: { 
    type: Date, 
    required: true,
    index: true
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Indexes สำหรับการค้นหาที่มีประสิทธิภาพ
bookingSchema.index({ status: 1, expires_at: 1 });
bookingSchema.index({ booker_email: 1 });
bookingSchema.index({ travel_date: 1, status: 1 });
bookingSchema.index({ created_at: -1 });

// Static Methods

// สร้าง Booking ID อัตโนมัติ
bookingSchema.statics.generateBookingId = async function(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateCode = `${year}${month}${day}`;
  
  // หาการจองล่าสุดในวันนี้เพื่อเพิ่มตัวนับ
  const latestBooking = await this.findOne({
    booking_id: { $regex: `^BK-${dateCode}-` }
  }).sort({ booking_id: -1 });
  
  let counter = 1;
  if (latestBooking && latestBooking.booking_id) {
    const match = latestBooking.booking_id.match(/\d+$/);
    if (match) {
      counter = parseInt(match[0]) + 1;
    }
  }
  
  const counterStr = counter.toString().padStart(3, '0');
  return `BK-${dateCode}-${counterStr}`;
};

// ค้นหาการจองที่รออนุมัติ
bookingSchema.statics.findPendingBookings = function(limit: number = 50) {
  return this.find({ 
    status: 'pending',
    expires_at: { $gt: new Date() }  // ยังไม่หมดอายุ
  })
  .populate('approved_by', 'name email')
  .sort({ created_at: 1 })  // เก่าสุดก่อน (FIFO)
  .limit(limit);
};

// ค้นหาการจองที่หมดอายุ
bookingSchema.statics.findExpiredBookings = function() {
  return this.find({
    status: 'pending',
    expires_at: { $lt: new Date() }
  });
};

// ค้นหาการจองตามวันเดินทาง
bookingSchema.statics.findByTravelDate = function(travelDate: string, status?: string) {
  const query: any = { travel_date: travelDate };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('approved_by', 'name email')
    .sort({ created_at: -1 });
};

// ค้นหาการจองของลูกค้า
bookingSchema.statics.findByBookerEmail = function(email: string) {
  return this.find({ booker_email: email.toLowerCase() })
    .sort({ created_at: -1 });
};

// สถิติการจองต่อวัน
bookingSchema.statics.getDailyBookingStats = async function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        created_at: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          status: "$status"
        },
        count: { $sum: 1 },
        totalAmount: { $sum: "$total_price" },
        totalTickets: { $sum: "$total_tickets" }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        stats: {
          $push: {
            status: "$_id.status",
            count: "$count",
            totalAmount: "$totalAmount",
            totalTickets: "$totalTickets"
          }
        },
        dailyTotal: { $sum: "$totalAmount" },
        dailyTickets: { $sum: "$totalTickets" }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Instance Methods

// ตรวจสอบว่าหมดอายุหรือไม่
bookingSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expires_at;
};

// ตรวจสอบว่าสามารถยกเลิกได้หรือไม่
bookingSchema.methods.canCancel = function(): boolean {
  return this.status === 'pending' && !this.isExpired();
};

// ตรวจสอบว่าสามารถอนุมัติได้หรือไม่
bookingSchema.methods.canApprove = function(): boolean {
  return this.status === 'pending' && 
         this.payment_slip && 
         !this.isExpired();
};

// คำนวณเวลาที่เหลือก่อนหมดอายุ
bookingSchema.methods.getTimeRemaining = function(): number {
  return Math.max(0, this.expires_at.getTime() - new Date().getTime());
};

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // ตรวจสอบว่า passenger_emails มีจำนวนเท่ากับ total_tickets
  if (this.passenger_emails.length !== this.total_tickets) {
    return next(new Error('Number of passenger emails must equal total tickets'));
  }
  
  // ตรวจสอบว่า total_price ตรงกับ price_per_ticket * total_tickets
  if (this.total_price !== this.price_per_ticket * this.total_tickets) {
    return next(new Error('Total price must equal price per ticket times total tickets'));
  }
  
  next();
});

// ตั้งค่าการหมดอายุอัตโนมัติ
bookingSchema.methods.setExpirationTime = function(hours: number = 24) {
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + hours);
  this.expires_at = expirationTime;
};

// Virtual fields
bookingSchema.virtual('statusText').get(function() {
  const statusMap = {
    'pending': 'รอการตรวจสอบ',
    'approved': 'อนุมัติแล้ว',
    'cancelled': 'ยกเลิกแล้ว',
    'expired': 'หมดอายุ'
  };
  return statusMap[this.status] || this.status;
});

bookingSchema.virtual('isActive').get(function() {
  return this.status === 'approved';
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Handle multiple model compilation
const Booking: Model<IBooking> = mongoose.models.Booking || 
  mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;