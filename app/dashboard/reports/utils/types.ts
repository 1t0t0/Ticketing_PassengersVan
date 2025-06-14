// app/dashboard/reports/utils/types.ts - Type definitions สำหรับ export utils

export interface Period {
  startDate: string;
  endDate: string;
}

export interface QuickStats {
  totalTickets?: number;
  totalRevenue?: number;
  totalPassengers?: number;
  activeDrivers?: number;
  avgTicketPrice?: number;
  avgPricePerPassenger?: number;
  groupTicketPercentage?: number;
  individualTicketPercentage?: number;
}

export interface TicketBreakdown {
  individual?: {
    count: number;
    revenue: number;
    passengers: number;
    percentage: number;
  };
  group?: {
    count: number;
    revenue: number;
    passengers: number;
    percentage: number;
    averageGroupSize: number;
  };
}

export interface PaymentMethod {
  _id: string;
  count: number;
  revenue: number;
}

export interface CarType {
  carType_name: string;
  count: number;
  activeCars?: number;
}

export interface User {
  name: string;
  employeeId: string;
  checkInStatus?: 'checked-in' | 'checked-out';
}

export interface Car {
  car_id?: string;
  car_name?: string;
  car_registration?: string;
  carType?: CarType;
  car_capacity?: number;
  user_id?: User;
}

export interface Driver {
  name?: string;
  employeeId?: string;
  workDays?: number;
  totalIncome?: number;
  performance?: string;
  lastCheckIn?: string;
  lastCheckOut?: string;
}

export interface Staff {
  name?: string;
  employeeId?: string;
  checkInStatus?: 'checked-in' | 'checked-out';
  ticketsSold?: number;
  workDays?: number;
  lastCheckIn?: string;
  lastCheckOut?: string;
}

export interface FinancialBreakdownItem {
  totalAmount?: number;
  transactionCount?: number;
}

export interface FinancialBreakdown {
  company?: FinancialBreakdownItem;
  station?: FinancialBreakdownItem;
  driver?: FinancialBreakdownItem;
}

export interface SummaryData {
  totalTickets?: number;
  totalRevenue?: number;
  totalPassengers?: number;
  averagePrice?: number;
  averagePricePerPassenger?: number;
  ticketBreakdown?: TicketBreakdown;
  totalDrivers?: number;
  workingDriversInPeriod?: number;
  revenuePerDriver?: number;
  totalIncome?: number;
  activeDrivers?: number;
  totalCars?: number;
  activeCars?: number;
  totalCarTypes?: number;
  driversWithCars?: number;
  totalStaff?: number;
  activeStaff?: number;
  totalTicketsSold?: number;
  totalWorkDays?: number;
}

export interface ReportData {
  period: Period;
  quickStats?: QuickStats;
  summary?: SummaryData;
  sales?: SummaryData;
  paymentMethods?: PaymentMethod[];
  carTypes?: CarType[];
  cars?: Car[];
  drivers?: Driver[];
  staff?: Staff[];
  breakdown?: FinancialBreakdown;
  financial?: FinancialBreakdown;
}

export type ReportType = 'summary' | 'sales' | 'drivers' | 'financial' | 'vehicles' | 'staff';

export type FormatCurrencyFunction = (amount: number) => string;