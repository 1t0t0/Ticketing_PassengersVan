// models/Driver.ts
import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // เพิ่ม field นี้
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  checkInStatus: { type: String, enum: ['checked-in', 'checked-out'], default: 'checked-out' },
  lastCheckIn: { type: Date },
  lastCheckOut: { type: Date },
}, { timestamps: true });

export default mongoose.models.Driver || mongoose.model('Driver', driverSchema);