// models/Car.ts - Enhanced with CarType reference
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICar extends Document {
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: mongoose.Schema.Types.ObjectId | string; // Reference to CarType
  user_id: mongoose.Schema.Types.ObjectId | string; // Foreign key to User model
  createdAt: Date;
  updatedAt: Date;
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
    default: 10,
    min: 1,
    max: 100
  },
  car_registration: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true
  },
  car_type_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CarType',
    required: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { timestamps: true });

// Create indexes for better performance
carSchema.index({ user_id: 1 });
carSchema.index({ car_type_id: 1 });
carSchema.index({ car_registration: 1 }, { unique: true });
carSchema.index({ car_id: 1 }, { unique: true });

// Define static method to find cars by user ID
carSchema.statics.findByUserId = function(userId: string) {
  return this.find({ user_id: userId })
    .populate('car_type_id', 'carType_name')
    .populate('user_id', 'name email employeeId');
};

// Define static method to find cars by car type
carSchema.statics.findByCarType = function(carTypeId: string) {
  return this.find({ car_type_id: carTypeId })
    .populate('car_type_id', 'carType_name')
    .populate('user_id', 'name email employeeId');
};

// Define static method to get car statistics
carSchema.statics.getCarStatistics = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'cartypes',
        localField: 'car_type_id',
        foreignField: '_id',
        as: 'carType'
      }
    },
    {
      $unwind: '$carType'
    },
    {
      $group: {
        _id: '$carType.carType_name',
        count: { $sum: 1 },
        totalCapacity: { $sum: '$car_capacity' },
        avgCapacity: { $avg: '$car_capacity' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Middleware to ensure car_registration is always uppercase
carSchema.pre('save', function(next) {
  if (this.car_registration) {
    this.car_registration = this.car_registration.toUpperCase();
  }
  next();
});

// Virtual to get car type name (when populated)
carSchema.virtual('carTypeName').get(function() {
  return this.car_type_id && typeof this.car_type_id === 'object' 
    ? this.car_type_id.carType_name 
    : null;
});

// Virtual to get driver name (when populated)
carSchema.virtual('driverName').get(function() {
  return this.user_id && typeof this.user_id === 'object' 
    ? this.user_id.name 
    : null;
});

// Ensure virtual fields are serialized
carSchema.set('toJSON', { virtuals: true });
carSchema.set('toObject', { virtuals: true });

// Handle the case where this model might be compiled multiple times
const Car: Model<ICar> = mongoose.models.Car || mongoose.model<ICar>('Car', carSchema);

export default Car;