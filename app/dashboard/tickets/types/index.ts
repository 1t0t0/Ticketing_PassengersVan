// app/dashboard/tickets/types/index.ts - FIXED NewTicket interface
// Types for Ticket Management

// Ticket interface - Enhanced with driver assignment
export interface Ticket {
  _id: string;
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date | string;
  
  // Group Ticket fields
  ticketType: 'individual' | 'group';
  passengerCount: number;        // จำนวนผู้โดยสาร (default: 1)
  pricePerPerson: number;        // ราคาต่อคน (45,000)
  
  // Destination field
  destination?: string;          // ปลายทาง (ไม่บังคับ)
  
  // Driver Assignment fields
  assignedDriverId?: string;     // ID ของคนขับที่ได้รับมอบหมาย
  isAssigned?: boolean;          // สถานะการมอบหมาย
  assignedAt?: Date | string;    // วันที่มอบหมาย
  
  // Trip Status (เมื่อคนขับสแกน QR Code)
  isScanned?: boolean;           // สถานะการสแกน
  scannedAt?: Date | string;     // วันที่สแกน
  scannedBy?: string;            // คนขับที่สแกน
  tripId?: string;               // ID ของรอบเดินทาง
  
  // Additional info from response
  assignmentInfo?: {
    driverId: string;
    driverName: string;
    driverEmployeeId: string;
    carRegistration: string;
    carName: string;
    carCapacity: number;
    assignedAt: Date;
    note?: string;
  };
}

// Dashboard Stats interface
export interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalDrivers: number;
  totalStaff: number;
  checkedInDrivers: number;
  checkedInStaff: number;
  hourlyTickets?: Array<{ _id: number; count: number; revenue: number }>;
  paymentMethodStats?: {
    cash: number;
    qr: number;
  };
}

// ✅ FIXED: New Ticket interface for creating tickets
export interface NewTicket {
  price: number;
  paymentMethod: 'cash' | 'qr';
  
  // Group Ticket fields
  ticketType: 'individual' | 'group';
  passengerCount: number;
  pricePerPerson: number;
  
  // Destination field
  destination?: string;          // ปลายทาง (ไม่บังคับ)
  
  // ✅ FIXED: Car Assignment field (this gets converted to assignedDriverId on the server)
  selectedCarRegistration?: string;  // ทะเบียนรถที่เลือก (ส่งไปยัง API)
}

// Car interface
export interface Car {
  _id: string;
  car_id: string;
  car_name: string;
  car_registration: string;
  car_capacity: number;
  user_id: {
    _id: string;
    name: string;
    employeeId: string;
    checkInStatus: 'checked-in' | 'checked-out';
  };
  carType?: {
    carType_name: string;
  };
}

// Ticket Filter interface
export interface TicketFilter {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'all' | 'cash' | 'qr';
  ticketType?: 'all' | 'individual' | 'group';
  assignedCarRegistration?: string;  // Filter by assigned car
  page: number;
  limit: number;
}

// Pagination interface
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

// Ticket Search Results
export interface TicketSearchResults {
  tickets: Ticket[];
  pagination: Pagination;
  driverStats?: Array<{
    driverId: string;
    driverName: string;
    ticketCount: number;
    totalRevenue: number;
  }>;
}

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Group Ticket Configuration
export interface GroupTicketConfig {
  minPassengers: number;    // ขั้นต่ำ 2 คน
  maxPassengers: number;    // สูงสุด 10 คน
  pricePerPerson: number;   // ราคาต่อคน 45,000
}

// QR Code Data for Group Tickets - Enhanced with driver info
export interface QRCodeData {
  ticketNumber: string;
  ticketType: 'individual' | 'group';
  passengerCount: number;
  totalPrice: number;
  pricePerPerson: number;
  soldAt: string;
  paymentMethod: string;
  soldBy: string;
  validationKey: string;
  destination?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
}

// Route Information Interface
export interface RouteInfo {
  origin: string;             // จุดเริ่มต้น (มักจะเป็น "ສະຖານີລົດໄຟ")
  destination: string;        // ปลายทาง
  duration?: string;          // ระยะเวลาการเดินทาง
  distance?: string;          // ระยะทาง
  assignedDriver?: any;       // คนขับที่รับผิดชอบเส้นทางนี้
}

// Default destinations
export const DEFAULT_DESTINATIONS = [
  'ຕົວເມືອງ',              // ตัวเมือง (ค่าเริ่มต้น)
  'ໂຮງແຮມ',                // โรงแรม
  'ຕະຫຼາດ',                 // ตลาด
  'ໂຮງພະຍາບານ',            // โรงพยาบาล
  'ມະຫາວິທະຍາໄລ',          // มหาวิทยาลัย
  'ບິກຊີ',                  // Big C
  'ເກລັກ',                  // แกลง
] as const;

// Destination Type
export type DestinationType = typeof DEFAULT_DESTINATIONS[number] | string;

// Driver Assignment Status
export interface DriverAssignmentStatus {
  driverId: string;
  driverName: string;
  employeeId: string;
  totalAssignedTickets: number;
  completedTrips: number;
  pendingTickets: number;
  checkInStatus: 'checked-in' | 'checked-out';
  lastActivity?: Date;
}

// Ticket Assignment Summary
export interface TicketAssignmentSummary {
  totalTickets: number;
  assignedTickets: number;
  unassignedTickets: number;
  driverAssignments: DriverAssignmentStatus[];
}

// Driver Performance Stats
export interface DriverPerformanceStats {
  driverId: string;
  driverName: string;
  totalTicketsAssigned: number;
  totalRevenue: number;
  completedTrips: number;
  averagePassengersPerTrip: number;
  totalWorkingDays: number;
  efficiency: number; // percentage
}