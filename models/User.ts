// models/User.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the shared User interface
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'staff' | 'driver' | 'station';
  
  // Driver specific fields
  employeeId?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  checkInStatus?: 'checked-in' | 'checked-out';
  lastCheckIn?: Date;
  lastCheckOut?: Date;
  
  // เพิ่มฟิลด์ birthDate
  birthDate?: string;
  
  // Station specific fields
  stationId?: string;
  stationName?: string;
  location?: string;
}

// models/User.ts (แก้ไขเฉพาะ schema)
const userSchema = new Schema({
  // Common fields for all roles
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'staff', 'driver', 'station'],
    required: true 
  },
  
  // Driver specific fields
  employeeId: { type: String, sparse: true },
  phone: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  checkInStatus: { type: String, enum: ['checked-in', 'checked-out'], default: 'checked-out' },
  lastCheckIn: { type: Date },
  lastCheckOut: { type: Date },
  
  // เพิ่มฟิลด์สำหรับวันเกิด
  birthDate: { type: String },
  
  // เพิ่มฟิลด์สำหรับรูปภาพ
  idCardNumber: { type: String },
  idCardImage: { type: String },
  userImage: { type: String },
  
  // Station specific fields
  stationId: { type: String, sparse: true },
  stationName: { type: String },
  location: { type: String }
}, { timestamps: true });

// Create indexes for efficient queries
userSchema.index({ role: 1 });
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ stationId: 1 }, { sparse: true });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Helper method to find drivers with additional filtering
userSchema.statics.findDrivers = function(filter = {}) {
  return this.find({
    role: 'driver',
    ...filter
  });
};

// Helper method to find stations with additional filtering
userSchema.statics.findStations = function(filter = {}) {
  return this.find({
    role: 'station',
    ...filter
  });
};

// Handle the case where this model might be compiled multiple times
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;