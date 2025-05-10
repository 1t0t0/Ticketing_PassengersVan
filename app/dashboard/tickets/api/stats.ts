import { DashboardStats } from '../types';

/**
 * ดึงข้อมูลสถิติสำหรับแสดงบนหน้า Dashboard
 * @param startDate วันที่เริ่มต้น (ถ้ามี)
 * @param endDate วันที่สิ้นสุด (ถ้ามี)
 * @returns ข้อมูลสถิติต่างๆ
 */
export async function fetchDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
  let url = '/api/dashboard/stats';
  
  // เพิ่ม query parameters ถ้ามี
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  // เพิ่ม query string ถ้ามี parameters
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch dashboard stats');
  }
  
  return response.json();
}

/**
 * ดึงข้อมูลสถิติการขายตั๋วตามช่วงเวลา (รายชั่วโมง)
 * @param date วันที่ต้องการดูข้อมูล
 * @returns ข้อมูลการขายตั๋วรายชั่วโมง
 */
export async function fetchHourlySalesStats(date: string): Promise<{ hour: number; count: number; revenue: number }[]> {
  const response = await fetch(`/api/dashboard/stats/hourly?date=${date}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch hourly sales stats');
  }
  
  return response.json();
}

/**
 * ดึงข้อมูลสถิติวิธีการชำระเงิน
 * @param startDate วันที่เริ่มต้น (ถ้ามี)
 * @param endDate วันที่สิ้นสุด (ถ้ามี)
 * @returns ข้อมูลสถิติวิธีการชำระเงิน
 */
export async function fetchPaymentMethodStats(startDate?: string, endDate?: string): Promise<{ cash: number; qr: number }> {
  let url = '/api/dashboard/stats/payment-methods';
  
  // เพิ่ม query parameters ถ้ามี
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  // เพิ่ม query string ถ้ามี parameters
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch payment method stats');
  }
  
  return response.json();
}