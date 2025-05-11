import { useState, useCallback } from 'react';
import { fetchDashboardStats } from '../api/stats';
import { fetchTickets } from '../api/ticket';
import { DashboardStats, Ticket } from '../types';
import { RECENT_TICKETS_COUNT } from '../config/constants';
import notificationService from '@/lib/notificationService';

/**
 * Hook for managing stats data and recent tickets with improved error handling
 */
export default function useTicketStats() {
  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalDrivers: 0,
    totalStaff: 0,
    checkedInDrivers: 0,
    checkedInStaff: 0,
    paymentMethodStats: {
      cash: 65,
      qr: 35
    }
  });
  
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch stats and recent tickets
  const fetchData = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      // Fetch stats
      try {
        const statsData = await fetchDashboardStats(startDate, endDate);
        setStats(statsData);
      } catch (statsError) {
        console.error('Error fetching dashboard stats:', statsError);
        // Stats fetch error is already handled in the fetchDashboardStats function
        // which will return default values in case of an error
      }
      
      // Fetch recent tickets
      try {
        const ticketsResponse = await fetchTickets(1, RECENT_TICKETS_COUNT);
        
        if (ticketsResponse && ticketsResponse.tickets) {
          setRecentTickets(ticketsResponse.tickets);
        } else {
          setRecentTickets([]);
        }
      } catch (ticketsError) {
        console.error('Error fetching recent tickets:', ticketsError);
        setRecentTickets([]);
      }
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      notificationService.error(error?.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    stats,
    recentTickets,
    loading,
    fetchData
  };
}