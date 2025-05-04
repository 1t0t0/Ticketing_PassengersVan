import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  ticketPrice: { 
    type: Number, 
    required: true,
    default: 160 
  },
  revenueSharing: {
    company: { type: Number, default: 10 },  // 10%
    station: { type: Number, default: 20 },  // 20%
    drivers: { type: Number, default: 70 }   // 70%
  },
  operatingHours: {
    start: { type: String, default: '06:00' },
    end: { type: String, default: '22:00' }
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);