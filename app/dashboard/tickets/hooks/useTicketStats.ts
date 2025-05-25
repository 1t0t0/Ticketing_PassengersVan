// app/dashboard/tickets/hooks/useTicketStats.ts - ปรับปรุงเพื่อให้ดึงข้อมูลได้แม่นยำยิ่งขึ้น
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
  
  // Fetch stats and recent tickets with current date filter
  const fetchData = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    
    try {
      // **ปรับปรุง: ใช้วันที่ปัจจุบันเป็นค่าเริ่มต้น**
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const filterStartDate = startDate || todayString;
      const filterEndDate = endDate || todayString;
      
      console.log('Fetching stats for date range:', filterStartDate, 'to', filterEndDate);
      
      // Fetch stats with date filter
      try {
        const statsData = await fetchDashboardStats(filterStartDate, filterEndDate);
        
        console.log('Stats fetched:', {
          totalTicketsSold: statsData.totalTicketsSold,
          totalRevenue: statsData.totalRevenue,
          dateRange: `${filterStartDate} to ${filterEndDate}`
        });
        
        setStats(statsData);
      } catch (statsError) {
        console.error('Error fetching dashboard stats:', statsError);
        notificationService.error('ບໍ່ສາມາດດຶງຂໍ້ມູນສະຖິຕິໄດ້');
        
        // ใช้ค่าเริ่มต้นถ้ามีปัญหา
        setStats({
          totalTicketsSold: 0,
          totalRevenue: 0,
          totalDrivers: 0,
          totalStaff: 0,
          checkedInDrivers: 0,
          checkedInStaff: 0,
          paymentMethodStats: {
            cash: 50,
            qr: 50
          }
        });
      }
      
      // Fetch recent tickets
      try {
        const ticketsResponse = await fetchTickets(1, RECENT_TICKETS_COUNT);
        
        if (ticketsResponse && ticketsResponse.tickets) {
          console.log('Recent tickets fetched:', ticketsResponse.tickets.length);
          setRecentTickets(ticketsResponse.tickets);
        } else {
          console.log('No recent tickets found');
          setRecentTickets([]);
        }
      } catch (ticketsError) {
        console.error('Error fetching recent tickets:', ticketsError);
        setRecentTickets([]);
      }
      
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      notificationService.error(error?.message || 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // **เพิ่มฟังก์ชันสำหรับรีเฟรชข้อมูลวันนี้โดยเฉพาะ**
  const refreshTodayStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    console.log('Refreshing today stats for:', today);
    return fetchData(today, today);
  }, [fetchData]);
  
  return {
    stats,
    recentTickets,
    loading,
    fetchData,
    refreshTodayStats // เพิ่มฟังก์ชันใหม่
  };
}