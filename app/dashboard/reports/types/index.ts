// app/dashboard/reports/types/index.ts
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
    totalWorkDays: number;
    totalIncome: number;
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

export type ReportData = 
  | SalesReportData 
  | DriverReportData 
  | RouteReportData 
  | FinancialReportData 
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