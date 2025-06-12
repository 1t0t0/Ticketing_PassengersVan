// models/Booking.ts - Updated with approve/reject methods
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBooking extends Document {
  bookingNumber: string;
  passengerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  tripDetails: {
    pickupLocation: string;
    destination: string;
    travelDate: Date;
    travelTime: string;
    passengers: number;
  };
  pricing: {
    basePrice: number;
    totalAmount: number;
  };
  paymentSlip?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  ticketNumbers: string[];
  adminNotes?: string;
  approvedBy?: mongoose.Schema.Types.ObjectId;
  approvedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isExpired(): boolean;
  approve(adminId: string, notes?: string): Promise<IBooking>;
  reject(adminId: string, notes?: string): Promise<IBooking>;
}

const bookingSchema = new Schema({
  bookingNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passengerInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  tripDetails: {
    pickupLocation: { type: String, required: true },
    destination: { type: String, required: true },
    travelDate: { type: Date, required: true },
    travelTime: { type: String, required: true },
    passengers: { type: Number, required: true, min: 1, max: 10 }
  },
  pricing: {
    basePrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
  },
  paymentSlip: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  ticketNumbers: [{ type: String }],
  adminNotes: { type: String },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { type: Date },
  expiresAt: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, { timestamps: true });

// Indexes
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'passengerInfo.phone': 1 });
bookingSchema.index({ 'tripDetails.travelDate': 1 });
bookingSchema.index({ createdAt: -1 });

// 🔧 แก้ไข generateBookingNumber - หลีกเลี่ยง scientific notation
bookingSchema.statics.generateBookingNumber = async function(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2); // "25"
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // "06"
  const day = date.getDate().toString().padStart(2, '0'); // "12"
  
  const datePrefix = `B${year}${month}${day}`;
  
  // หา booking ล่าสุดในวันนี้
  const latestBooking = await this.findOne({
    bookingNumber: { $regex: `^${datePrefix}` }
  }).sort({ bookingNumber: -1 });
  
  let counter = 1;
  if (latestBooking && latestBooking.bookingNumber) {
    const lastNumber = latestBooking.bookingNumber.replace(datePrefix, '');
    const lastCounter = parseInt(lastNumber, 10);
    if (!isNaN(lastCounter)) {
      counter = lastCounter + 1;
    }
  }
  
  const counterStr = counter.toString().padStart(3, '0');
  const bookingNumber = `${datePrefix}${counterStr}`;
  
  console.log('🎫 Generated booking number:', bookingNumber);
  return bookingNumber;
};

// Static method: Create booking with auto-generated number
bookingSchema.statics.createBooking = async function(bookingData: Partial<IBooking>): Promise<IBooking> {
  const bookingNumber = await this.generateBookingNumber();
  
  const booking = new this({
    ...bookingData,
    bookingNumber,
    status: 'pending'
  });
  
  return await booking.save();
};

// ✅ เพิ่ม generateTicketNumber utility function
async function generateTicketNumber(): Promise<string> {
  const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', new Schema({}));
  
  // ใช้ระบบ UUID สำหรับ ticket numbers เหมือนใน tickets/route.ts
  const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const maxAttempts = 20;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    // สร้าง ticket number: T + 5 หลักสุ่ม
    let ticketNumber = 'T';
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
      ticketNumber += SAFE_CHARS[randomIndex];
    }
    
    console.log(`🎲 Generated candidate ticket: ${ticketNumber} (attempt ${attempt})`);
    
    // ตรวจสอบว่าซ้ำมั้ย
    const existingTicket = await Ticket.findOne({ ticketNumber });
    
    if (!existingTicket) {
      console.log(`✅ Unique ticket number found: ${ticketNumber}`);
      return ticketNumber;
    }
    
    console.log(`⚠️ ${ticketNumber} already exists, trying again...`);
  }
  
  // 🆘 ถ้าลองแล้วยังซ้ำ ให้ใส่ timestamp
  const timestamp = Date.now().toString().slice(-2);
  const emergency = `T${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${timestamp}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}`;
  
  console.log(`🆘 Using emergency ticket number: ${emergency}`);
  return emergency;
}

// ✅ Instance method: Approve booking
bookingSchema.methods.approve = async function(adminId: string, adminNotes?: string): Promise<IBooking> {
  console.log('🎯 Starting booking approval process for:', this.bookingNumber);
  
  if (this.status !== 'pending') {
    throw new Error('เฉพาะการจองที่รอการอนุมัติเท่านั้นที่สามารถอนุมัติได้');
  }
  
  if (this.isExpired()) {
    this.status = 'expired';
    await this.save();
    throw new Error('การจองนี้หมดอายุแล้ว');
  }
  
  if (!this.paymentSlip) {
    throw new Error('ต้องมีสลิปการโอนเงินก่อนอนุมัติ');
  }
  
  try {
    // สร้างตั๋ว
    const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', new Schema({
      ticketNumber: { type: String, required: true, unique: true },
      price: { type: Number, required: true },
      paymentMethod: { type: String, enum: ['cash', 'qr'], default: 'qr' },
      soldBy: { type: String, required: true },
      soldAt: { type: Date, default: Date.now },
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
    }));
    
    const ticketNumbers: string[] = [];
    const passengers = this.tripDetails.passengers;
    const pricePerTicket = this.pricing.basePrice;
    
    console.log(`🎫 Creating ${passengers} tickets at ₭${pricePerTicket} each`);
    
    // สร้างตั๋วตามจำนวนผู้โดยสาร
    for (let i = 0; i < passengers; i++) {
      const ticketNumber = await generateTicketNumber();
      
      const ticket = await Ticket.create({
        ticketNumber,
        price: pricePerTicket,
        paymentMethod: 'qr', // การจองล่วงหน้าถือว่าเป็น QR payment
        soldBy: `Booking-${this.bookingNumber}`,
        soldAt: new Date(),
        bookingId: this._id
      });
      
      ticketNumbers.push(ticketNumber);
      console.log(`✅ Created ticket ${i + 1}/${passengers}: ${ticketNumber}`);
    }
    
    // อัปเดตการจอง
    this.status = 'approved';
    this.approvedBy = new mongoose.Types.ObjectId(adminId);
    this.approvedAt = new Date();
    this.ticketNumbers = ticketNumbers;
    if (adminNotes) this.adminNotes = adminNotes;
    
    await this.save();
    
    console.log('🎉 Booking approved successfully:', {
      bookingNumber: this.bookingNumber,
      ticketNumbers: ticketNumbers,
      approvedBy: adminId
    });
    
    return this;
    
  } catch (error) {
    console.error('❌ Error in booking approval:', error);
    throw new Error(`การอนุมัติล้มเหลว: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ✅ Instance method: Reject booking
bookingSchema.methods.reject = async function(adminId: string, adminNotes?: string): Promise<IBooking> {
  console.log('❌ Starting booking rejection process for:', this.bookingNumber);
  
  if (this.status !== 'pending') {
    throw new Error('เฉพาะการจองที่รอการอนุมัติเท่านั้นที่สามารถปฏิเสธได้');
  }
  
  // อัปเดตการจอง
  this.status = 'rejected';
  this.approvedBy = new mongoose.Types.ObjectId(adminId);
  this.approvedAt = new Date();
  if (adminNotes) this.adminNotes = adminNotes;
  
  await this.save();
  
  console.log('✅ Booking rejected successfully:', {
    bookingNumber: this.bookingNumber,
    rejectedBy: adminId,
    reason: adminNotes
  });
  
  return this;
};

// Virtual: Status in Lao
bookingSchema.virtual('statusLao').get(function() {
  const statusMap = {
    'pending': 'ລໍຖ້າການອະນຸມັດ',
    'approved': 'ອະນຸມັດແລ້ວ',
    'rejected': 'ປະຕິເສດ',
    'expired': 'ໝົດອາຍຸ'
  };
  return statusMap[this.status] || this.status;
});

// Instance method: Check if booking is expired
bookingSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt && this.status === 'pending';
};

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Handle the case where this model might be compiled multiple times
const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;