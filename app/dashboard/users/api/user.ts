// API functions สำหรับการจัดการผู้ใช้
import { User, NewUser, NewCar } from '../types';

// ดึงข้อมูลผู้ใช้ทั้งหมด
export async function fetchAllUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
}

// ดึงข้อมูลผู้ใช้ตามบทบาท
export async function fetchUsersByRole(role: string): Promise<User[]> {
  const response = await fetch(`/api/users?role=${role}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${role}s`);
  }
  
  return response.json();
}

// ดึงข้อมูลรถทั้งหมด
export async function fetchCarsByUser(): Promise<any[]> {
  const response = await fetch('/api/cars');
  
  if (!response.ok) {
    throw new Error('Failed to fetch cars');
  }
  
  return response.json();
}

// เปลี่ยนสถานะการเช็คอิน/เช็คเอาท์
export async function checkInOutUser(userId: string, status: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkInStatus: status }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update check in status');
  }
}

// สร้างผู้ใช้ใหม่
export async function createUser(userData: NewUser): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create user');
  }
  
  return response.json();
}

// สร้างรถสำหรับคนขับ
export async function createCarForDriver(carData: NewCar, driverId: string): Promise<any> {
  const response = await fetch('/api/cars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...carData,
      user_id: driverId,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create car');
  }
  
  return response.json();
}

// ลบผู้ใช้
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete user');
  }
}

// ลบรถที่เกี่ยวข้องกับคนขับ
export async function deleteDriverCars(driverId: string): Promise<void> {
  const response = await fetch(`/api/cars/by-driver/${driverId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to delete associated cars:', errorData);
  }
}