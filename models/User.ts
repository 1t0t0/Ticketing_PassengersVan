// models/User.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// Define the shared User interface
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'staff' | 'driver';
  
  // Driver specific fields
  employeeId?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  checkInStatus?: 'checked-in' | 'checked-out';
  lastCheckIn?: Date;
  lastCheckOut?: Date;
}

const userSchema = new Schema({
  // Common fields for all roles
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'driver'], required: true },
  
  // Driver specific fields - will only be populated for driver role
  employeeId: { type: String, sparse: true, unique: true },
  phone: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  checkInStatus: { type: String, enum: ['checked-in', 'checked-out'], default: 'checked-out' },
  lastCheckIn: { type: Date },
  lastCheckOut: { type: Date }
}, { timestamps: true });

// Create indexes for efficient queries
userSchema.index({ role: 1 });
userSchema.index({ employeeId: 1 }, { sparse: true });

// Helper method to find drivers with additional filtering
userSchema.statics.findDrivers = function(filter = {}) {
  return this.find({
    role: 'driver',
    ...filter
  });
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;