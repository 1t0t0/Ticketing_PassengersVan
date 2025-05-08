// models/Car.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICar extends Document {
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  user_id: mongoose.Schema.Types.ObjectId | string; // Foreign key to User model
}

const carSchema = new Schema({
  car_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  car_name: { 
    type: String, 
    required: true 
  },
  car_capacity: { 
    type: Number, 
    required: true,
    default: 10 
  },
  car_registration: { 
    type: String, 
    required: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { timestamps: true });

// Define static method to find cars by user ID
carSchema.statics.findByUserId = function(userId: string) {
  return this.find({ user_id: userId });
};

// Handle the case where this model might be compiled multiple times
const Car: Model<ICar> = mongoose.models.Car || mongoose.model<ICar>('Car', carSchema);

export default Car;