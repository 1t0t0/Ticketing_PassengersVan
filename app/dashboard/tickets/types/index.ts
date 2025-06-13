// app/dashboard/tickets/types/index.ts - Enhanced with Group Ticket Support
// Types for Ticket Management

// Ticket interface - Enhanced with Group Ticket support
export interface Ticket {
  _id: string;
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date | string;
  
  // ✅ เพิ่มฟิลด์สำหรับ Group Ticket
  ticketType: 'individual' | 'group';
  passengerCount: number;        // จำนวนผู้โดยสาร (default: 1)
  pricePerPerson: number;        // ราคาต่อคน (45,000)
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

// New Ticket interface for creating tickets - Enhanced
export interface NewTicket {
  price: number;
  paymentMethod: 'cash' | 'qr';
  
  // ✅ เพิ่มฟิลด์สำหรับ Group Ticket
  ticketType: 'individual' | 'group';
  passengerCount: number;
  pricePerPerson: number;
}

// Ticket Filter interface
export interface TicketFilter {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'all' | 'cash' | 'qr';
  ticketType?: 'all' | 'individual' | 'group'; // ✅ เพิ่มการกรองตามประเภทตั๋ว
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

// ✅ เพิ่ม: Group Ticket Configuration
export interface GroupTicketConfig {
  minPassengers: number;    // ขั้นต่ำ 2 คน
  maxPassengers: number;    // สูงสุด 10 คน
  pricePerPerson: number;   // ราคาต่อคน 45,000
}

// ✅ เพิ่ม: QR Code Data for Group Tickets
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
}