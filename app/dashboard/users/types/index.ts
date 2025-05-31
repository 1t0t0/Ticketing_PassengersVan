// app/dashboard/users/types/index.ts - Updated with WorkLog integration
// Types for User Management

// Re-export WorkLog types
export * from './worklog';

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
  unhashedPassword?: string;
  createdAt?: Date;
  updatedAt?: Date;
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

// Car Type interface
export interface CarType {
  _id: string;
  carType_id: string;
  carType_name: string;
  created_at?: Date;
  updated_at?: Date;
}

// Car interface
export interface Car {
  _id?: string;
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: string;
  user_id: string;
  carType?: CarType;
  user?: Partial<User>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for creating a new car
export interface NewCar {
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: string;
  user_id: string;
}

// Driver interface with optional car information
export interface Driver extends User {
  assignedCar?: Car;
  assignedCars?: Car[];
}

// Car data for forms
export interface CarFormData {
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: string;
}

// API Response interfaces
export interface CreateUserWithCarResponse {
  user: User;
  car?: Car;
  success: boolean;
  message?: string;
}

// Car statistics interface
export interface CarStatistics {
  _id: string; // Car type name
  count: number;
  totalCapacity: number;
  avgCapacity: number;
}

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Form validation interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Search and filter interfaces
export interface UserSearchFilter {
  searchTerm?: string;
  role?: string;
  status?: string;
  checkInStatus?: string;
}

export interface CarSearchFilter {
  searchTerm?: string;
  carType?: string;
  driverId?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

// Pagination interface
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Dashboard statistics interface for cars
export interface CarDashboardStats {
  totalCars: number;
  totalDrivers: number;
  driversWithCars: number;
  driversWithoutCars: number;
  carsByType: CarStatistics[];
  avgCapacityPerCar: number;
  totalCapacity: number;
}