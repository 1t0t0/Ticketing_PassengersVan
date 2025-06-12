// models/Ticket.ts - Updated to support booking system
import mongoose, { Document, Model } from 'mongoose';

export interface ITicketDocument extends Document {
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date;
  
  // Booking-related fields
  bookingId?: mongoose.Schema.Types.ObjectId;
  passengerName?: string;
  isFromBooking?: boolean;
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
  
  // New fields for booking system
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking',
    sparse: true // Allow null values and don't require unique
  },
  passengerName: { 
    type: String,
    sparse: true
  },
  isFromBooking: { 
    type: Boolean, 
    default: false 
  }
});

// Add indexes for new fields
ticketSchema.index({ bookingId: 1 }, { sparse: true });
ticketSchema.index({ isFromBooking: 1 });
ticketSchema.index({ passengerName: 1 }, { sparse: true });

// Static method: Find tickets by booking
ticketSchema.statics.findByBooking = function(bookingId: string) {
  return this.find({ bookingId });
};

// Static method: Find booking tickets for today
ticketSchema.statics.findBookingTicketsToday = function() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  return this.find({
    isFromBooking: true,
    soldAt: { $gte: startOfDay, $lte: endOfDay }
  }).populate('bookingId');
};

// Virtual: Ticket type in Lao
ticketSchema.virtual('ticketTypeLao').get(function() {
  return this.isFromBooking ? 'ປີ້ຈອງ' : 'ປີ້ປົກກະຕິ';
});

// Virtual: Ticket prefix for display
ticketSchema.virtual('displayNumber').get(function() {
  if (this.isFromBooking) {
    return `🎫 ${this.ticketNumber} (ຈອງ)`;
  }
  return `🎫 ${this.ticketNumber}`;
});

// Ensure virtual fields are serialized
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

const Ticket: Model<ITicketDocument> = mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', ticketSchema);

export default Ticket;