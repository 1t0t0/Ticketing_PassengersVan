// models/CarType.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICarType extends Document {
  carType_id: string;
  carType_name: string;
  created_at: Date;
  updated_at: Date;
}

const carTypeSchema = new Schema({
  carType_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  carType_name: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Handle the case where this model might be compiled multiple times
const CarType: Model<ICarType> = mongoose.models.CarType || mongoose.model<ICarType>('CarType', carTypeSchema);

export default CarType;