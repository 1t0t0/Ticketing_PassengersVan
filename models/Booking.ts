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

// 🔧 ลบ index ซ้ำ - ใช้เฉพาะใน schema definition
// bookingSchema.index({ bookingNumber: 1 }, { unique: true }); // <- ลบบรรทัดนี้
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
  
  // 🔧 แก้ไข: ใช้ตัวเลขแยกกันแทนการต่อ string
  const datePrefix = `B${year}${month}${day}`;
  
  // หา booking ล่าสุดในวันนี้
  const latestBooking = await this.findOne({
    bookingNumber: { $regex: `^${datePrefix}` }
  }).sort({ bookingNumber: -1 });
  
  let counter = 1;
  if (latestBooking && latestBooking.bookingNumber) {
    // 🔧 แก้ไข: ดึงตัวเลขท้ายแบบปลอดภัย
    const lastNumber = latestBooking.bookingNumber.replace(datePrefix, '');
    const lastCounter = parseInt(lastNumber, 10);
    if (!isNaN(lastCounter)) {
      counter = lastCounter + 1;
    }
  }
  
  // 🔧 แก้ไข: ใช้ padStart แทนการคำนวณ
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