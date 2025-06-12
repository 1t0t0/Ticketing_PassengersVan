// models/Booking.ts
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

// Create indexes for efficient queries
bookingSchema.index({ bookingNumber: 1 }, { unique: true });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'passengerInfo.phone': 1 });
bookingSchema.index({ 'tripDetails.travelDate': 1 });
bookingSchema.index({ createdAt: -1 });

// Static method: Generate unique booking number
bookingSchema.statics.generateBookingNumber = async function(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Find the last booking for today
  const datePrefix = `B${year}${month}${day}`;
  const latestBooking = await this.findOne({
    bookingNumber: { $regex: `^${datePrefix}` }
  }).sort({ bookingNumber: -1 });
  
  let counter = 1;
  if (latestBooking && latestBooking.bookingNumber) {
    const match = latestBooking.bookingNumber.match(/\d+$/);
    if (match) {
      counter = parseInt(match[0]) + 1;
    }
  }
  
  const counterStr = counter.toString().padStart(3, '0');
  return `${datePrefix}${counterStr}`;
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

// Static method: Find bookings by status
bookingSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method: Find bookings by phone
bookingSchema.statics.findByPhone = function(phone: string) {
  return this.find({ 'passengerInfo.phone': phone }).sort({ createdAt: -1 });
};

// Static method: Find bookings for today
bookingSchema.statics.findTodayBookings = function() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  return this.find({
    'tripDetails.travelDate': { $gte: startOfDay, $lte: endOfDay }
  }).sort({ 'tripDetails.travelTime': 1 });
};

// Instance method: Check if booking is expired
bookingSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt && this.status === 'pending';
};

// Instance method: Approve booking and generate tickets
bookingSchema.methods.approve = async function(approvedBy: string, adminNotes?: string): Promise<void> {
  const Ticket = mongoose.models.Ticket || require('./Ticket').default;
  
  // Generate ticket numbers for each passenger
  const ticketNumbers: string[] = [];
  
  for (let i = 0; i < this.tripDetails.passengers; i++) {
    // Use existing ticket generation logic
    const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ticketNumber = 'R'; // R for Reserved tickets
    
    for (let j = 0; j < 5; j++) {
      const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
      ticketNumber += SAFE_CHARS[randomIndex];
    }
    
    // Ensure uniqueness
    const existing = await Ticket.findOne({ ticketNumber });
    if (existing) {
      // Try again with timestamp
      const timestamp = Date.now().toString().slice(-2);
      ticketNumber = `R${timestamp}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}${SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]}`;
    }
    
    // Create ticket in database
    await Ticket.create({
      ticketNumber,
      price: this.pricing.basePrice,
      soldBy: 'booking-system',
      paymentMethod: 'qr', // Assume online payment
      soldAt: new Date(),
      bookingId: this._id,
      passengerName: this.passengerInfo.name,
      isFromBooking: true
    });
    
    ticketNumbers.push(ticketNumber);
  }
  
  // Update booking
  this.status = 'approved';
  this.ticketNumbers = ticketNumbers;
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  if (adminNotes) {
    this.adminNotes = adminNotes;
  }
  
  await this.save();
};

// Instance method: Reject booking
bookingSchema.methods.reject = async function(rejectedBy: string, adminNotes?: string): Promise<void> {
  this.status = 'rejected';
  this.approvedBy = rejectedBy;
  this.approvedAt = new Date();
  if (adminNotes) {
    this.adminNotes = adminNotes;
  }
  
  await this.save();
};

// Middleware: Auto-expire old pending bookings
bookingSchema.pre('find', function() {
  // Auto-mark expired bookings
  this.updateMany(
    { 
      status: 'pending', 
      expiresAt: { $lt: new Date() } 
    },
    { 
      $set: { status: 'expired' } 
    }
  );
});

// Virtual: Format travel date
bookingSchema.virtual('formattedTravelDate').get(function() {
  return this.tripDetails.travelDate.toLocaleDateString('lo-LA');
});

// Virtual: Days until travel
bookingSchema.virtual('daysUntilTravel').get(function() {
  const today = new Date();
  const travelDate = new Date(this.tripDetails.travelDate);
  const diffTime = travelDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

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

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Handle the case where this model might be compiled multiple times
const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;