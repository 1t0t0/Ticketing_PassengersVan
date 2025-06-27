// models/Ticket.ts - Enhanced with Driver Assignment Support
import mongoose, { Document, Model } from 'mongoose';

export interface ITicketDocument extends Document {
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date;
  
  // Group Ticket Support
  ticketType: 'individual' | 'group';
  passengerCount: number;        // จำนวนผู้โดยสาร
  pricePerPerson: number;        // ราคาต่อคน
  
  // Destination Support
  destination?: string;          // ปลายทาง (ไม่บังคับ)
  
  // ✅ NEW: Driver Assignment Support
  assignedDriverId?: mongoose.Schema.Types.ObjectId; // คนขับที่ได้รับมอบหมาย
  isAssigned?: boolean;          // สถานะการมอบหมาย
  assignedAt?: Date;             // วันที่มอบหมาย
  
  // Trip Status (เมื่อคนขับสแกน QR Code)
  isScanned?: boolean;           // สถานะการสแกน
  scannedAt?: Date;              // วันที่สแกน
  scannedBy?: mongoose.Schema.Types.ObjectId; // คนขับที่สแกน
  tripId?: mongoose.Schema.Types.ObjectId;    // ID ของรอบเดินทาง
}

const ticketSchema = new mongoose.Schema({
  ticketNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  soldBy: { 
    type: String, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['cash', 'card', 'qr'] 
  },
  soldAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Group Ticket fields
  ticketType: {     
    type: String,
    enum: ['individual', 'group'],
    default: 'individual',
    required: true
  },
  passengerCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
    required: true
  },
  pricePerPerson: {
    type: Number,
    required: true,
    default: 45000
  },
  
  // Destination field
  destination: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'ຕົວເມືອງ'
  },
  
  // ✅ NEW: Driver Assignment fields
  assignedDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isAssigned: {
    type: Boolean,
    default: function() {
      return !!this.assignedDriverId;
    }
  },
  assignedAt: {
    type: Date,
    default: function() {
      return this.assignedDriverId ? new Date() : null;
    }
  },
  
  // ✅ NEW: Trip Status fields (when scanned by driver)
  isScanned: {
    type: Boolean,
    default: false
  },
  scannedAt: {
    type: Date,
    default: null
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriverTrip',
    default: null
  }
});

// Indexes สำหรับการค้นหา
ticketSchema.index({ ticketType: 1 });
ticketSchema.index({ passengerCount: 1 });
ticketSchema.index({ soldAt: -1, ticketType: 1 });
ticketSchema.index({ destination: 1 });
// ✅ NEW: Indexes for driver assignment
ticketSchema.index({ assignedDriverId: 1 });
ticketSchema.index({ isAssigned: 1 });
ticketSchema.index({ isScanned: 1 });
ticketSchema.index({ assignedDriverId: 1, isScanned: 1 });

// Virtual Fields
ticketSchema.virtual('isGroupTicket').get(function() {
  return this.ticketType === 'group';
});

ticketSchema.virtual('totalPassengers').get(function() {
  return this.passengerCount;
});

ticketSchema.virtual('routeInfo').get(function() {
  return {
    origin: 'ສະຖານີລົດໄຟ',
    destination: this.destination || 'ຕົວເມືອງ',
    fullRoute: `ສະຖານີລົດໄຟ → ${this.destination || 'ຕົວເມືອງ'}`
  };
});

// ✅ NEW: Virtual field for assignment status
ticketSchema.virtual('assignmentStatus').get(function() {
  if (!this.assignedDriverId) return 'unassigned';
  if (this.isScanned) return 'completed';
  return 'assigned';
});

// Static Methods
ticketSchema.statics.findGroupTickets = function(filter = {}) {
  return this.find({
    ticketType: 'group',
    ...filter
  });
};

ticketSchema.statics.findIndividualTickets = function(filter = {}) {
  return this.find({
    ticketType: 'individual',
    ...filter
  });
};

ticketSchema.statics.findByDestination = function(destination: string, filter = {}) {
  return this.find({
    destination: new RegExp(destination, 'i'),
    ...filter
  });
};

// ✅ NEW: Static Methods for Driver Assignment
ticketSchema.statics.findByDriver = function(driverId: string, filter = {}) {
  return this.find({
    assignedDriverId: driverId,
    ...filter
  }).populate('assignedDriverId', 'name employeeId checkInStatus');
};

ticketSchema.statics.findUnassignedTickets = function(filter = {}) {
  return this.find({
    $or: [
      { assignedDriverId: null },
      { assignedDriverId: { $exists: false } }
    ],
    ...filter
  });
};

ticketSchema.statics.findAssignedButNotScanned = function(driverId?: string) {
  const query: any = {
    assignedDriverId: { $ne: null, $exists: true },
    isScanned: false
  };
  
  if (driverId) {
    query.assignedDriverId = driverId;
  }
  
  return this.find(query).populate('assignedDriverId', 'name employeeId');
};

// ✅ NEW: Driver Assignment Statistics
ticketSchema.statics.getDriverAssignmentStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = {};
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalTickets: { $sum: 1 },
        assignedTickets: {
          $sum: {
            $cond: [{ $ne: ['$assignedDriverId', null] }, 1, 0]
          }
        },
        scannedTickets: {
          $sum: {
            $cond: ['$isScanned', 1, 0]
          }
        }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalTickets: 0,
    assignedTickets: 0,
    scannedTickets: 0
  };
  
  result.unassignedTickets = result.totalTickets - result.assignedTickets;
  result.pendingTickets = result.assignedTickets - result.scannedTickets;
  
  return result;
};

// ✅ NEW: Driver Performance Statistics
ticketSchema.statics.getDriverPerformanceStats = async function(driverId: string, startDate?: Date, endDate?: Date) {
  const matchFilter: any = { assignedDriverId: driverId };
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalTicketsAssigned: { $sum: 1 },
        totalRevenue: { $sum: '$price' },
        totalPassengers: { $sum: '$passengerCount' },
        scannedTickets: {
          $sum: {
            $cond: ['$isScanned', 1, 0]
          }
        }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalTicketsAssigned: 0,
    totalRevenue: 0,
    totalPassengers: 0,
    scannedTickets: 0
  };
  
  result.efficiency = result.totalTicketsAssigned > 0 
    ? Math.round((result.scannedTickets / result.totalTicketsAssigned) * 100)
    : 0;
  
  return result;
};

ticketSchema.statics.getDestinationStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = {};
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$destination',
        ticketCount: { $sum: 1 },
        totalPassengers: { $sum: '$passengerCount' },
        totalRevenue: { $sum: '$price' }
      }
    },
    {
      $sort: { ticketCount: -1 }
    }
  ]);
  
  return stats;
};

ticketSchema.statics.getGroupTicketStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = { ticketType: 'group' };
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalGroupTickets: { $sum: 1 },
        totalPassengers: { $sum: '$passengerCount' },
        totalRevenue: { $sum: '$price' },
        avgPassengersPerGroup: { $avg: '$passengerCount' },
        minGroupSize: { $min: '$passengerCount' },
        maxGroupSize: { $max: '$passengerCount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalGroupTickets: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    avgPassengersPerGroup: 0,
    minGroupSize: 0,
    maxGroupSize: 0
  };
};

ticketSchema.statics.getComprehensiveStats = async function(startDate?: Date, endDate?: Date) {
  const matchFilter: any = {};
  
  if (startDate && endDate) {
    matchFilter.soldAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$ticketType',
        ticketCount: { $sum: 1 },
        totalPassengers: { $sum: '$passengerCount' },
        totalRevenue: { $sum: '$price' }
      }
    }
  ]);
  
  const result = {
    individual: { ticketCount: 0, totalPassengers: 0, totalRevenue: 0 },
    group: { ticketCount: 0, totalPassengers: 0, totalRevenue: 0 },
    total: { ticketCount: 0, totalPassengers: 0, totalRevenue: 0 }
  };
  
  stats.forEach(stat => {
    result[stat._id as keyof typeof result] = {
      ticketCount: stat.ticketCount,
      totalPassengers: stat.totalPassengers,
      totalRevenue: stat.totalRevenue
    };
  });
  
  // คำนวณรวม
  result.total = {
    ticketCount: result.individual.ticketCount + result.group.ticketCount,
    totalPassengers: result.individual.totalPassengers + result.group.totalPassengers,
    totalRevenue: result.individual.totalRevenue + result.group.totalRevenue
  };
  
  return result;
};

// ✅ NEW: Method to mark ticket as scanned
ticketSchema.methods.markAsScanned = function(scannedByDriverId: string, tripId: string) {
  this.isScanned = true;
  this.scannedAt = new Date();
  this.scannedBy = scannedByDriverId;
  this.tripId = tripId;
  return this.save();
};

// Pre-save middleware: ตรวจสอบความถูกต้องของข้อมูล
ticketSchema.pre('save', function(next) {
  // ตรวจสอบว่า price = pricePerPerson * passengerCount
  const expectedPrice = this.pricePerPerson * this.passengerCount;
  if (this.price !== expectedPrice) {
    this.price = expectedPrice;
  }
  
  // ตรวจสอบ passengerCount สำหรับ group ticket
  if (this.ticketType === 'group' && this.passengerCount < 2) {
    return next(new Error('Group ticket must have at least 2 passengers'));
  }
  
  if (this.ticketType === 'individual' && this.passengerCount !== 1) {
    this.passengerCount = 1;
  }
  
  // ตรวจสอบและทำความสะอาดปลายทาง
  if (this.destination) {
    this.destination = this.destination.trim();
    if (!this.destination) {
      this.destination = 'ຕົວເມືອງ';
    }
  } else {
    this.destination = 'ຕົວເມືອງ';
  }
  
  // ✅ NEW: Update assignment status automatically
  this.isAssigned = !!this.assignedDriverId;
  if (this.assignedDriverId && !this.assignedAt) {
    this.assignedAt = new Date();
  }
  
  next();
});

// Ensure virtual fields are serialized
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

const Ticket: Model<ITicketDocument> = mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', ticketSchema);

export default Ticket;