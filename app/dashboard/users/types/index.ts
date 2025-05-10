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
}

// Car interface
export interface Car {
  _id?: string;
  car_id?: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type: string;
  user_id?: string;
}

// Driver interface (extended from User)
export interface Driver extends User {
  assignedCar?: Car;
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

// Interface for creating a new car
export interface NewCar {
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type: string;
}

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}