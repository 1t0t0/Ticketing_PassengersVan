// app/dashboard/users/types/worklog.ts
// Types for WorkLog Management

export interface WorkLog {
  _id: string;
  user_id: string;
  action: 'check-in' | 'check-out';
  timestamp: Date | string;
  date: string; // YYYY-MM-DD format
  created_at?: Date;
  updated_at?: Date;
  
  // Virtual fields
  formattedTime?: string;
  actionText?: string;
}

export interface WorkLogStats {
  totalDays: number;
  dailyLogs: { [date: string]: WorkLog[] };
  logs: WorkLog[];
}

export interface DailyAttendanceStats {
  _id: string; // user_id
  user: {
    _id: string;
    name: string;
    employeeId?: string;
    role: string;
  };
  actions: Array<{
    action: 'check-in' | 'check-out';
    count: number;
    latestTime: Date;
  }>;
}

export interface WorkLogFilter {
  userId?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  action?: 'check-in' | 'check-out';
  limit?: number;
}

export interface WorkLogCreateRequest {
  userId: string;
  action: 'check-in' | 'check-out';
}

export interface WorkLogResponse {
  success: boolean;
  workLog?: WorkLog;
  message?: string;
  error?: string;
}