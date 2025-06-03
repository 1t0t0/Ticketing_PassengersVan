// app/dashboard/reports/types/index.ts - เพิ่ม interface สำหรับรายงานใหม่

export interface ReportPeriod {
  startDate: string;
  endDate: string;
}

export interface SalesReportData {
  type: 'sales';
  period: ReportPeriod;
  summary: {
    totalTickets: number;
    totalRevenue: number;
    averagePrice: number;
  };
  paymentMethods: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
  hourlySales: Array<{
    _id: number;
    count: number;
    revenue: number;
  }>;
  dailyTrend: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    count: number;
    revenue: number;
  }>;
}

export interface DriverReportData {
  type: 'drivers';
  period: ReportPeriod;
  summary: {
    totalDrivers: number;
    activeDrivers: number;
    workingDriversInPeriod: number;
    totalWorkDays: number;
    totalIncome: number;
    revenuePerDriver: number;
  };
  drivers: Array<{
    id: string;
    name: string;
    employeeId: string;
    checkInStatus: string;
    workDays: number;
    totalIncome: number;
    ticketCount: number;
    performance: string;
  }>;
  metadata: {
    totalRevenue: number;
    driverSharePercentage: number;
    workingDriversCount: number;
    revenuePerDriver: number;
    dailyBreakdown: Array<any>;
  };
}

export interface RouteReportData {
  type: 'routes';
  period: ReportPeriod;
  summary: {
    totalTrips: number;
    averageOccupancy: string;
    mostPopularRoute: string;
    averageTripTime: string;
  };
  routes: Array<{
    name: string;
    tickets: number;
    revenue: number;
    occupancyRate: number;
    avgTripTime: number;
  }>;
}

export interface FinancialReportData {
  type: 'financial';
  period: ReportPeriod;
  summary: {
    totalRevenue: number;
    companyShare: number;
    stationShare: number;
    driverShare: number;
  };
  breakdown: {
    company: {
      totalAmount: number;
      transactionCount: number;
    };
    station: {
      totalAmount: number;
      transactionCount: number;
    };
    driver: {
      totalAmount: number;
      transactionCount: number;
    };
  };
}

// เพิ่ม interface สำหรับรายงานรถ
export interface VehiclesReportData {
  type: 'vehicles';
  period: ReportPeriod;
  summary: {
    totalCars: number;
    activeCars: number;
    totalCarTypes: number;
    driversWithCars: number;
  };
  carTypes: Array<{
    _id: string;
    carType_name: string;
    count: number;
    activeCars: number;
  }>;
  cars: Array<{
    _id: string;
    car_id: string;
    car_name: string;
    car_registration: string;
    car_capacity: number;
    carType: {
      carType_name: string;
    } | null;
    user_id: {
      name: string;
      employeeId: string;
      checkInStatus: string;
    } | null;
  }>;
}

// เพิ่ม interface สำหรับรายงานพนักงาน
export interface StaffReportData {
  type: 'staff';
  period: ReportPeriod;
  summary: {
    totalStaff: number;
    activeStaff: number;
    totalTicketsSold: number;
    totalWorkHours: number;
    averageTicketsPerStaff: number;
    topPerformerTickets: number;
    averageWorkHours: number;
  };
  staff: Array<{
    id: string;
    name: string;
    employeeId: string;
    checkInStatus: string;
    lastCheckIn: string;
    lastCheckOut: string;
    ticketsSold: number;
    totalRevenue: number;
    workHours: number;
  }>;
  workHours: Array<{
    hour: number;
    ticketCount: number;
  }>;
}

export interface SummaryReportData {
  type: 'summary';
  period: ReportPeriod;
  sales: SalesReportData['summary'];
  drivers: DriverReportData['summary'];
  financial: FinancialReportData['summary'];
  quickStats: {
    totalTickets: number;
    totalRevenue: number;
    activeDrivers: number;
    avgTicketPrice: number;
  };
}

// อัปเดต union type ให้รวมรายงานใหม่
export type ReportData = 
  | SalesReportData 
  | DriverReportData 
  | RouteReportData 
  | FinancialReportData 
  | VehiclesReportData
  | StaffReportData
  | SummaryReportData;

export interface ReportType {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export interface TimeRange {
  value: string;
  label: string;
}

export interface ExportFormat {
  format: 'PDF' | 'Excel' | 'CSV' | 'Print';
  mimeType: string;
  extension: string;
}

// Utility types for report generation
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

// เพิ่ม interface สำหรับ vehicle performance
export interface VehiclePerformanceData {
  carId: string;
  carName: string;
  registration: string;
  totalTrips: number;
  totalRevenue: number;
  utilization: number; // เปอร์เซ็นต์การใช้งาน
  averageCapacity: number;
  maintenanceStatus: 'good' | 'needs_attention' | 'maintenance_required';
}

// เพิ่ม interface สำหรับ staff performance
export interface StaffPerformanceData {
  staffId: string;
  name: string;
  employeeId: string;
  ticketsSold: number;
  hoursWorked: number;
  efficiency: number; // ปี้ต่อชั่วโมง
  customerRating?: number;
  performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

// เพิ่ม interface สำหรับ car type statistics
export interface CarTypeStatistics {
  carTypeId: string;
  typeName: string;
  totalVehicles: number;
  activeVehicles: number;
  averageCapacity: number;
  totalTrips: number;
  revenue: number;
  utilizationRate: number;
}

// เพิ่ม interface สำหรับ work schedule
export interface WorkScheduleData {
  date: string;
  staffId: string;
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked: number;
  ticketsSold: number;
  status: 'present' | 'absent' | 'late' | 'early_leave';
}