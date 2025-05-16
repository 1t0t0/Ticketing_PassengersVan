// app/dashboard/users/types/index.ts
// Types for User Management

// User interface
export interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff' | 'driver' | 'station';
  phone?: string;
  birthDate?: string;
  idCardNumber?: string;
  idCardImage?: string;
  userImage?: string;
  employeeId?: string;
  stationId?: string;
  stationName?: string;
  location?: string;
  status?: 'active' | 'inactive';
  checkInStatus?: 'checked-in' | 'checked-out';
  lastCheckIn?: Date;
  lastCheckOut?: Date;
  unhashedPassword?: string; // เพิ่มฟิลด์นี้
}

// Interface for creating a new user
export interface NewUser {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'driver' | 'station';
  phone?: string;
  birthDate?: string;
  idCardNumber?: string;
  idCardImage?: string;
  userImage?: string;
  status?: 'active' | 'inactive';
  checkInStatus?: 'checked-in' | 'checked-out';
  location?: string;
}

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}