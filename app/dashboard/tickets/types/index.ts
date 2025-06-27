// app/dashboard/tickets/types/index.ts - Enhanced with Destination Support
// Types for Ticket Management

// Ticket interface - Enhanced with destination support
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
  
  // ✅ เพิ่มฟิลด์ปลายทาง
  destination?: string;          // ปลายทาง (ไม่บังคับ)
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

// New Ticket interface for creating tickets - Enhanced with destination
export interface NewTicket {
  price: number;
  paymentMethod: 'cash' | 'qr';
  
  // Group Ticket fields
  ticketType: 'individual' | 'group';
  passengerCount: number;
  pricePerPerson: number;
  
  // ✅ เพิ่มฟิลด์ปลายทาง
  destination?: string;          // ปลายทาง (ไม่บังคับ)
}

// Ticket Filter interface
export interface TicketFilter {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'all' | 'cash' | 'qr';
  ticketType?: 'all' | 'individual' | 'group';
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

// QR Code Data for Group Tickets - Enhanced with destination
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
  
  // ✅ เพิ่มข้อมูลปลายทาง
  destination?: string;
}

// ✅ เพิ่ม: Route Information Interface
export interface RouteInfo {
  origin: string;             // จุดเริ่มต้น (มักจะเป็น "ສະຖານີລົດໄຟ")
  destination: string;        // ปลายทาง
  duration?: string;          // ระยะเวลาการเดินทาง
  distance?: string;          // ระยะทาง
}

// ✅ เพิ่ม: Default destinations
export const DEFAULT_DESTINATIONS = [
  'ຕົວເມືອງ',              // ตัวเมือง (ค่าเริ่มต้น)
  'ໂຮງແຮມ',                // โรงแรม
  'ຕະຫຼາດ',                 // ตลาด
  'ໂຮງພະຍາບານ',            // โรงพยาบาล
  'ມະຫາວິທະຍາໄລ',          // มหาวิทยาลัย
  'ບິກຊີ',                  // Big C
  'ເກລັກ',                  // แกลง
] as const;

// ✅ เพิ่ม: Destination Type
export type DestinationType = typeof DEFAULT_DESTINATIONS[number] | string;