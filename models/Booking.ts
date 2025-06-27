// models/Booking.ts - ระบบการจองรถ
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBooking extends Document {
  booking_id: string;
  car_id: mongoose.Schema.Types.ObjectId;
  driver_id: mongoose.Schema.Types.ObjectId;
  booked_by: string; // ผู้จอง (staff/admin email)
  booked_passengers: number; // จำนวนผู้โดยสารที่จอง
  car_capacity: number; // ความจุรถ
  remaining_capacity: number; // ที่นั่งที่เหลือ
  
  // สถานะการจอง
  status: 'booked' | 'in_trip' | 'completed' | 'cancelled';
  
  // ข้อมูลการจอง
  booking_date: Date;
  expected_departure?: Date; // เวลาออกเดินทางที่คาดหวัง
  
  // ข้อมูลการเดินทาง
  trip_started_at?: Date;
  trip_completed_at?: Date;
  actual_passengers?: number; // จำนวนผู้โดยสารจริงเมื่อเดินทาง
  
  // ข้อมูลตั๋ว
  tickets: Array<{
    ticket_id: mongoose.Schema.Types.ObjectId;
    ticket_number: string;
    passenger_count: number;
    ticket_type: 'individual' | 'group';
  }>;
  
  // หมายเหตุ
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema({
  booking_id: {
    type: String,
    required: true,
    unique: true
  },
  car_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booked_by: {
    type: String,
    required: true
  },
  booked_passengers: {
    type: Number,
    required: true,
    min: 1
  },
  car_capacity: {
    type: Number,
    required: true
  },
  remaining_capacity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['booked', 'in_trip', 'completed', 'cancelled'],
    default: 'booked'
  },
  booking_date: {
    type: Date,
    default: Date.now
  },
  expected_departure: Date,
  trip_started_at: Date,
  trip_completed_at: Date,
  actual_passengers: Number,
  tickets: [{
    ticket_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true
    },
    ticket_number: {
      type: String,
      required: true
    },
    passenger_count: {
      type: Number,
      required: true
    },
    ticket_type: {
      type: String,
      enum: ['individual', 'group'],
      required: true
    }
  }],
  notes: String
}, { 
  timestamps: true 
});

// Indexes
bookingSchema.index({ car_id: 1, status: 1 });
bookingSchema.index({ driver_id: 1, status: 1 });
bookingSchema.index({ status: 1, booking_date: -1 });
bookingSchema.index({ booking_id: 1 }, { unique: true });

// Pre-save middleware: สร้าง booking_id อัตโนมัติ
bookingSchema.pre('save', async function(next) {
  if (!this.booking_id) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // หา booking ล่าสุดเพื่อเพิ่มตัวนับ
    const latestBooking = await (this.constructor as Model<IBooking>)
      .findOne()
      .sort({ booking_id: -1 });
    
    let counter = 1;
    if (latestBooking && latestBooking.booking_id) {
      const match = latestBooking.booking_id.match(/\d+$/);
      if (match) {
        counter = parseInt(match[0]) + 1;
      }
    }
    
    const counterStr = counter.toString().padStart(3, '0');
    this.booking_id = `BKG-${year}${month}${day}-${counterStr}`;
  }
  
  // คำนวณที่นั่งที่เหลือ
  this.remaining_capacity = this.car_capacity - this.booked_passengers;
  
  next();
});

// Static Methods

// สร้างการจองใหม่
bookingSchema.statics.createBooking = async function(
  carId: string,
  driverId: string,
  bookedBy: string,
  passengerCount: number,
  tickets: Array<any>,
  notes?: string
) {
  try {
    // ดึงข้อมูลรถ
    const Car = mongoose.models.Car;
    const car = await Car.findById(carId);
    
    if (!car) {
      throw new Error('ບໍ່ພົບຂໍ້ມູນລົດ');
    }
    
    // ตรวจสอบว่ารถว่างหรือไม่
    const existingBooking = await this.findOne({
      car_id: carId,
      status: { $in: ['booked', 'in_trip'] }
    });
    
    if (existingBooking) {
      throw new Error('ລົດນີ້ຖືກຈອງແລ້ວ ຫຼື ກຳລັງເດີນທາງ');
    }
    
    // ตรวจสอบจำนวนผู้โดยสาร
    if (passengerCount > car.car_capacity) {
      throw new Error(`ຈຳນວນຜູ້ໂດຍສານເກີນຄວາມຈຸລົດ (ສູງສຸດ ${car.car_capacity} ຄົນ)`);
    }
    
    // สร้างการจองใหม่
    const booking = new this({
      car_id: carId,
      driver_id: driverId,
      booked_by: bookedBy,
      booked_passengers: passengerCount,
      car_capacity: car.car_capacity,
      tickets: tickets,
      notes: notes
    });
    
    await booking.save();
    
    return booking;
  } catch (error) {
    throw error;
  }
};

// ดึงการจองที่ active สำหรับรถ
bookingSchema.statics.getActiveBookingForCar = function(carId: string) {
  return this.findOne({
    car_id: carId,
    status: { $in: ['booked', 'in_trip'] }
  }).populate('car_id driver_id tickets.ticket_id');
};

// ดึงการจองที่ active สำหรับคนขับ
bookingSchema.statics.getActiveBookingForDriver = function(driverId: string) {
  return this.findOne({
    driver_id: driverId,
    status: { $in: ['booked', 'in_trip'] }
  }).populate('car_id driver_id tickets.ticket_id');
};

// เริ่มการเดินทาง (เปลี่ยนสถานะจาก booked -> in_trip)
bookingSchema.statics.startTrip = async function(bookingId: string) {
  try {
    const booking = await this.findById(bookingId);
    
    if (!booking) {
      throw new Error('ບໍ່ພົບຂໍ້ມູນການຈອງ');
    }
    
    if (booking.status !== 'booked') {
      throw new Error('ການຈອງນີ້ບໍ່ສາມາດເລີ່ມການເດີນທາງໄດ້');
    }
    
    booking.status = 'in_trip';
    booking.trip_started_at = new Date();
    
    await booking.save();
    
    return booking;
  } catch (error) {
    throw error;
  }
};

// สิ้นสุดการเดินทาง (เปลี่ยนสถานะเป็น completed)
bookingSchema.statics.completeTrip = async function(bookingId: string, actualPassengers?: number) {
  try {
    const booking = await this.findById(bookingId);
    
    if (!booking) {
      throw new Error('ບໍ່ພົບຂໍ້ມູນການຈອງ');
    }
    
    if (booking.status !== 'in_trip') {
      throw new Error('ການຈອງນີ້ບໍ່ອາດສິ້ນສຸດການເດີນທາງໄດ້');
    }
    
    booking.status = 'completed';
    booking.trip_completed_at = new Date();
    
    if (actualPassengers !== undefined) {
      booking.actual_passengers = actualPassengers;
    }
    
    await booking.save();
    
    return booking;
  } catch (error) {
    throw error;
  }
};

// ยกเลิกการจอง
bookingSchema.statics.cancelBooking = async function(bookingId: string) {
  try {
    const booking = await this.findById(bookingId);
    
    if (!booking) {
      throw new Error('ບໍ່ພົບຂໍ້ມູນການຈອງ');
    }
    
    if (booking.status === 'completed') {
      throw new Error('ບໍ່ສາມາດຍົກເລີກການຈອງທີ່ສຳເລັດແລ້ວ');
    }
    
    booking.status = 'cancelled';
    
    await booking.save();
    
    return booking;
  } catch (error) {
    throw error;
  }
};

// ดึงสถิติการจอง
bookingSchema.statics.getBookingStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = {};
  
  if (startDate && endDate) {
    matchFilter.booking_date = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalPassengers: { $sum: '$booked_passengers' }
      }
    }
  ]);
  
  const result = {
    booked: { count: 0, totalPassengers: 0 },
    in_trip: { count: 0, totalPassengers: 0 },
    completed: { count: 0, totalPassengers: 0 },
    cancelled: { count: 0, totalPassengers: 0 },
    total: { count: 0, totalPassengers: 0 }
  };
  
  stats.forEach(stat => {
    if (result[stat._id as keyof typeof result]) {
      result[stat._id as keyof typeof result] = {
        count: stat.count,
        totalPassengers: stat.totalPassengers
      };
    }
  });
  
  // คำนวณรวม
  Object.values(result).forEach(item => {
    if (item !== result.total) {
      result.total.count += item.count;
      result.total.totalPassengers += item.totalPassengers;
    }
  });
  
  return result;
};

// Virtual fields
bookingSchema.virtual('isActive').get(function() {
  return ['booked', 'in_trip'].includes(this.status);
});

bookingSchema.virtual('occupancyPercentage').get(function() {
  return Math.round((this.booked_passengers / this.car_capacity) * 100);
});

bookingSchema.virtual('remainingPercentage').get(function() {
  return Math.round((this.remaining_capacity / this.car_capacity) * 100);
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Handle multiple model compilation
const Booking: Model<IBooking> = mongoose.models.Booking || 
  mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;