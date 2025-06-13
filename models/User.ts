// models/User.ts - Updated to use phone as primary login field
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the shared User interface
export interface IUser extends Document {
  phone: string; // Primary login field
  email?: string; // Optional, for compatibility
  password: string;
  name: string;
  role: 'admin' | 'staff' | 'driver' | 'station';
  
  // Driver specific fields
  employeeId?: string;
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
  
  // ID Card and Image fields
  idCardNumber?: string;
  idCardImage?: string;
  userImage?: string;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v: string) {
        // Validate Lao phone number format (10 digits)
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  email: { 
    type: String, 
    sparse: true, // Allows multiple null values but unique non-null values
    validate: {
      validator: function(v: string) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'staff', 'driver', 'station'], 
    required: true 
  },
  birthDate: Date,
  idCardNumber: String,
  idCardImage: String,
  userImage: String,
  employeeId: String,
  stationId: String,
  stationName: String,
  location: String,
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  checkInStatus: { 
    type: String, 
    enum: ['checked-in', 'checked-out'], 
    default: 'checked-out' 
  },
  lastCheckIn: Date,
  lastCheckOut: Date
}, {
  timestamps: true
});

// Create indexes for efficient queries
userSchema.index({ role: 1 });
userSchema.index({ phone: 1 }); // Primary index for login
userSchema.index({ email: 1 }, { sparse: true }); // Sparse index for email
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ stationId: 1 }, { sparse: true });

// Pre-save middleware to clean phone number
userSchema.pre('save', function(next) {
  if (this.phone) {
    // Remove any formatting and ensure it's just digits
    this.phone = this.phone.replace(/\D/g, '');
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by phone (for login)
userSchema.statics.findByPhone = function(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  return this.findOne({ phone: cleanPhone });
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

// Virtual to format phone number for display
userSchema.virtual('formattedPhone').get(function() {
  if (this.phone && this.phone.length === 10) {
    return `${this.phone.slice(0, 3)}-${this.phone.slice(3, 6)}-${this.phone.slice(6)}`;
  }
  return this.phone;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Handle the case where this model might be compiled multiple times
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;