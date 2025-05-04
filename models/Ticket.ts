// models/Ticket.ts
import mongoose, { Document, Model } from 'mongoose';

export interface ITicketDocument extends Document {
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date;
}

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  soldBy: { type: String, required: true },
  paymentMethod: { type: String, required: true, enum: ['cash', 'card', 'qr'] },
  soldAt: { type: Date, default: Date.now }
});

const Ticket: Model<ITicketDocument> = mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', ticketSchema);

export default Ticket;