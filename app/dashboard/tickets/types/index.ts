// Types for Ticket Management

// Ticket interface
export interface Ticket {
  _id: string;
  ticketNumber: string;
  price: number;
  soldBy: string;
  paymentMethod: 'cash' | 'card' | 'qr';
  soldAt: Date | string;
}

// Dashboard Stats interface
export interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalDrivers: number;
  checkedInDrivers: number;
  hourlyTickets?: Array<{ _id: number; count: number; revenue: number }>;
  paymentMethodStats?: {
    cash: number;
    qr: number;
  };
}

// New Ticket interface for creating tickets
export interface NewTicket {
  price: number;
  paymentMethod: 'cash' | 'qr';
}

// Ticket Filter interface
export interface TicketFilter {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'all' | 'cash' | 'qr';
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