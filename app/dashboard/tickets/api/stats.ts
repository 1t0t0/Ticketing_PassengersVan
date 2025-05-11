import { DashboardStats } from '../types';

/**
 * Fetch dashboard stats with improved error handling
 * @param startDate Optional start date
 * @param endDate Optional end date
 * @returns Dashboard stats
 */
export async function fetchDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
  let url = '/api/dashboard/stats';
  
  // Add query parameters if provided
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  // Add query string if parameters exist
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  try {
    const response = await fetch(url);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default stats to prevent UI errors
    return {
      totalTicketsSold: 0,
      totalRevenue: 0,
      totalDrivers: 0,
      totalStaff: 0,
      checkedInDrivers: 0,
      checkedInStaff: 0,
      hourlyTickets: [],
      paymentMethodStats: {
        cash: 50,
        qr: 50
      }
    };
  }
}

/**
 * Fetch hourly sales stats with improved error handling
 * @param date Date to view data for
 * @returns Hourly sales data
 */
export async function fetchHourlySalesStats(date: string): Promise<{ hour: number; count: number; revenue: number }[]> {
  try {
    const response = await fetch(`/api/dashboard/stats/hourly?date=${date}`);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching hourly sales stats:', error);
    // Return empty array to prevent UI errors
    return [];
  }
}

/**
 * Fetch payment method stats with improved error handling
 * @param startDate Optional start date
 * @param endDate Optional end date
 * @returns Payment method stats
 */
export async function fetchPaymentMethodStats(startDate?: string, endDate?: string): Promise<{ cash: number; qr: number }> {
  try {
    let url = '/api/dashboard/stats/payment-methods';
    
    // Add query parameters if provided
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    // Add query string if parameters exist
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching payment method stats:', error);
    // Return default stats to prevent UI errors
    return {
      cash: 50,
      qr: 50
    };
  }
}