// models/DriverTrip.ts - ระบบรอบการเดินทางและรายได้ Driver
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDriverTrip extends Document {
  driver_id: mongoose.Schema.Types.ObjectId;
  car_id: mongoose.Schema.Types.ObjectId;
  trip_number: number; // รอบที่ (1, 2, 3, ...)
  date: string; // YYYY-MM-DD
  status: 'in_progress' | 'completed' | 'cancelled';
  
  // ข้อมูลการสแกน QR Code
  scanned_tickets: Array<{
    ticket_id: mongoose.Schema.Types.ObjectId;
    scanned_at: Date;
    passenger_order: number; // ลำดับผู้โดยสาร (1, 2, 3, ...)
  }>;
  
  // ข้อมูลความจุรถ
  car_capacity: number;
  required_passengers: number; // 80% ของความจุ
  current_passengers: number;
  is_80_percent_reached: boolean;
  
  // เวลา
  started_at: Date;
  completed_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

const driverTripSchema = new Schema({
  driver_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  car_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Car',
    required: true 
  },
  trip_number: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  scanned_tickets: [{
    ticket_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ticket',
      required: true 
    },
    scanned_at: { 
      type: Date, 
      default: Date.now 
    },
    passenger_order: { 
      type: Number, 
      required: true 
    }
  }],
  car_capacity: { 
    type: Number, 
    required: true 
  },
  required_passengers: { 
    type: Number, 
    required: true 
  },
  current_passengers: { 
    type: Number, 
    default: 0 
  },
  is_80_percent_reached: { 
    type: Boolean, 
    default: false 
  },
  started_at: { 
    type: Date, 
    default: Date.now 
  },
  completed_at: Date
}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Indexes
driverTripSchema.index({ driver_id: 1, date: 1, trip_number: 1 });
driverTripSchema.index({ status: 1 });
driverTripSchema.index({ 'scanned_tickets.ticket_id': 1 }, { unique: true }); // ป้องกันสแกนซ้ำ

// Static method: เริ่มรอบใหม่
driverTripSchema.statics.startNewTrip = async function(driverId: string) {
  const Car = mongoose.model('Car');
  
  // ดึงข้อมูลรถของ driver
  const driverCar = await Car.findOne({ user_id: driverId });
  if (!driverCar) {
    throw new Error('ບໍ່ພົບຂໍ້ມູນລົດຂອງພະນັກງານຂັບລົດ');
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  // ตรวจสอบว่ามีรอบที่ยังไม่เสร็จหรือไม่
  const activeTrip = await this.findOne({
    driver_id: driverId,
    date: today,
    status: 'in_progress'
  });
  
  if (activeTrip) {
    throw new Error('ທ່ານມີການเດີນທາງທີ່ຍັງບໍ່ສຳເລັດ ກະລຸນາສຳເລັດກ່ອນ');
  }
  
  // หาว่าวันนี้เป็นรอบที่เท่าไหร่
  const tripCount = await this.countDocuments({
    driver_id: driverId,
    date: today
  });
  
  const tripNumber = tripCount + 1;
  const carCapacity = driverCar.car_capacity;
  const requiredPassengers = Math.floor(carCapacity * 0.8); // 80%
  
  // สร้างรอบใหม่
  const newTrip = await this.create({
    driver_id: driverId,
    car_id: driverCar._id,
    trip_number: tripNumber,
    date: today,
    car_capacity: carCapacity,
    required_passengers: requiredPassengers,
    current_passengers: 0,
    is_80_percent_reached: false,
    started_at: new Date()
  });
  
  return {
    success: true,
    trip_id: newTrip._id,
    trip_number: tripNumber,
    car_capacity: carCapacity,
    required_passengers: requiredPassengers,
    message: `ເລີ່ມການເດີນທາງຮອບທີ ${tripNumber} - ຕ້ອງການຜູ້ໂດຍສານ ${requiredPassengers}/${carCapacity} ຄົນ`
  };
};

// Static method: สแกน QR Code
driverTripSchema.statics.scanQRCode = async function(driverId: string, ticketId: string) {
  const Ticket = mongoose.model('Ticket');
  const today = new Date().toISOString().split('T')[0];
  
  // ตรวจสอบว่ามีรอบที่กำลังดำเนินการอยู่หรือไม่
  const activeTrip = await this.findOne({
    driver_id: driverId,
    date: today,
    status: 'in_progress'
  });
  
  if (!activeTrip) {
    throw new Error('ກະລຸນາເລີ່ມການເດີນທາງກ່ອນ');
  }
  
  // ตรวจสอบว่า ticket นี้ถูกสแกนแล้วหรือไม่
  const ticketAlreadyScanned = await this.findOne({
    'scanned_tickets.ticket_id': ticketId
  });
  
  if (ticketAlreadyScanned) {
    throw new Error('ຕັ້ວນີ້ຖືກສະແກນແລ້ວ');
  }
  
  // ตรวจสอบ ticket
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error('ບໍ່ພົບຂໍ້ມູນຕັ້ວ');
  }
  
  // เพิ่มผู้โดยสาร
  const passengerOrder = activeTrip.current_passengers + 1;
  
  activeTrip.scanned_tickets.push({
    ticket_id: ticketId,
    scanned_at: new Date(),
    passenger_order: passengerOrder
  });
  
  activeTrip.current_passengers = passengerOrder;
  
  // ตรวจสอบว่าครบ 80% หรือไม่
  const is80PercentReached = activeTrip.current_passengers >= activeTrip.required_passengers;
  activeTrip.is_80_percent_reached = is80PercentReached;
  
  // ถ้าครบ 80% ให้เปลี่ยนสถานะเป็น completed
  if (is80PercentReached) {
    activeTrip.status = 'completed';
    activeTrip.completed_at = new Date();
  }
  
  await activeTrip.save();
  
  return {
    success: true,
    trip_number: activeTrip.trip_number,
    current_passengers: activeTrip.current_passengers,
    required_passengers: activeTrip.required_passengers,
    car_capacity: activeTrip.car_capacity,
    occupancy_percentage: Math.round((activeTrip.current_passengers / activeTrip.car_capacity) * 100),
    is_80_percent_reached: is80PercentReached,
    trip_completed: is80PercentReached,
    message: is80PercentReached ? 
      `🎉 ສຳເລັດຮອບທີ ${activeTrip.trip_number}! ໄດ້ຮັບຜູ້ໂດຍສານ ${activeTrip.current_passengers} ຄົນ` :
      `ເພີ່ມຜູ້ໂດຍສານ: ${activeTrip.current_passengers}/${activeTrip.required_passengers} ຄົນ`,
    ticket_info: {
      ticket_number: ticket.ticketNumber,
      price: ticket.price,
      passenger_order: passengerOrder
    }
  };
};

// Static method: ดึงสถานะรอบปัจจุบัน
driverTripSchema.statics.getCurrentTripStatus = async function(driverId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const activeTrip = await this.findOne({
    driver_id: driverId,
    date: today,
    status: 'in_progress'
  }).populate('scanned_tickets.ticket_id', 'ticketNumber price soldBy');
  
  const completedTrips = await this.find({
    driver_id: driverId,
    date: today,
    status: 'completed'
  });
  
  const totalCompletedTrips = completedTrips.length;
  const qualifiesForRevenue = totalCompletedTrips >= 2;
  
  return {
    has_active_trip: !!activeTrip,
    active_trip: activeTrip ? {
      trip_id: activeTrip._id,
      trip_number: activeTrip.trip_number,
      current_passengers: activeTrip.current_passengers,
      required_passengers: activeTrip.required_passengers,
      car_capacity: activeTrip.car_capacity,
      started_at: activeTrip.started_at,
      passengers: activeTrip.scanned_tickets.map(scan => ({
        order: scan.passenger_order,
        ticket_number: scan.ticket_id?.ticketNumber,
        scanned_at: scan.scanned_at
      }))
    } : null,
    completed_trips_today: totalCompletedTrips,
    qualifies_for_revenue: qualifiesForRevenue,
    revenue_status: qualifiesForRevenue ? 
      'มีสิทธิ์ได้รับส่วนแบ่งรายได้ 85%' : 
      `ต้องทำอีก ${2 - totalCompletedTrips} รอบเพื่อได้รับส่วนแบ่งรายได้`
  };
};

// Static method: ดึงรายการ Driver ที่มีสิทธิ์ได้รับส่วนแบ่งรายได้
driverTripSchema.statics.getQualifiedDriversForRevenue = async function(date: string) {
  const qualifiedDrivers = await this.aggregate([
    {
      $match: {
        date: date,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$driver_id',
        completed_trips: { $sum: 1 },
        trips: { $push: '$$ROOT' }
      }
    },
    {
      $match: {
        completed_trips: { $gte: 2 } // อย่างน้อย 2 รอบ
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'driver'
      }
    },
    {
      $unwind: '$driver'
    },
    {
      $project: {
        driver_id: '$_id',
        driver_name: '$driver.name',
        employee_id: '$driver.employeeId',
        completed_trips: 1,
        total_passengers_transported: {
          $sum: '$trips.current_passengers'
        }
      }
    }
  ]);
  
  return qualifiedDrivers;
};

// Static method: คำนวณรายได้สำหรับ Driver ที่มีสิทธิ์
driverTripSchema.statics.calculateDriverRevenue = async function(date: string) {
  const Ticket = mongoose.model('Ticket');
  
  // ดึงรายได้รวมของวันนั้น
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');
  
  const totalRevenueResult = await Ticket.aggregate([
    {
      $match: {
        soldAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$price' }
      }
    }
  ]);
  
  const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
  const driverShareTotal = Math.round(totalRevenue * 0.85); // 85%
  
  // ดึง Driver ที่มีสิทธิ์
  const qualifiedDrivers = await this.getQualifiedDriversForRevenue(date);
  const qualifiedDriverCount = qualifiedDrivers.length;
  
  if (qualifiedDriverCount === 0) {
    return {
      total_revenue: totalRevenue,
      driver_share_total: driverShareTotal,
      qualified_drivers: 0,
      revenue_per_driver: 0,
      drivers: []
    };
  }
  
  const revenuePerDriver = Math.round(driverShareTotal / qualifiedDriverCount);
  
  return {
    total_revenue: totalRevenue,
    driver_share_total: driverShareTotal,
    qualified_drivers: qualifiedDriverCount,
    revenue_per_driver: revenuePerDriver,
    drivers: qualifiedDrivers.map(driver => ({
      ...driver,
      revenue_share: revenuePerDriver
    }))
  };
};

// Handle the case where this model might be compiled multiple times
const DriverTrip: Model<IDriverTrip> = mongoose.models.DriverTrip || 
  mongoose.model<IDriverTrip>('DriverTrip', driverTripSchema);

export default DriverTrip;