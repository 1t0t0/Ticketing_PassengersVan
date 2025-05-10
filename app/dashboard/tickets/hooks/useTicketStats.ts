import { useState, useCallback } from 'react';
import { fetchDashboardStats } from '../api/stats';
import { fetchTickets } from '../api/ticket';
import { DashboardStats, Ticket } from '../types';
import { RECENT_TICKETS_COUNT } from '../config/constants';
import notificationService from '@/lib/notificationService';

/**
 * Hook สำหรับจัดการข้อมูลสถิติและตั๋วล่าสุด
 */
export default function useTicketStats() {
  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalDrivers: 0,
    checkedInDrivers: 0,
    paymentMethodStats: {
      cash: 65,
      qr: 35
    }
  });
  
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ดึงข้อมูลสถิติและตั๋วล่าสุด
  const fetchData = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      // ดึงข้อมูลสถิติ
      const statsData = await fetchDashboardStats(startDate, endDate);
      setStats(statsData);
      
      // ดึงข้อมูลตั๋วล่าสุด
      try {
        const ticketsResponse = await fetchTickets(1, RECENT_TICKETS_COUNT);
        
        if (ticketsResponse.tickets) {
          setRecentTickets(ticketsResponse.tickets);
        } else {
          setRecentTickets([]);
        }
      } catch (error) {
        console.error('Error fetching recent tickets:', error);
        setRecentTickets([]);
      }
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ');
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