// app/dashboard/tickets/hooks/useTicketStats.ts (Enhanced Version)
import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchDashboardStats } from '../api/stats';
import { fetchTickets } from '../api/ticket';
import { DashboardStats, Ticket } from '../types';
import { RECENT_TICKETS_COUNT } from '../config/constants';
import notificationService from '@/lib/notificationService';

/**
 * Hook for managing stats data and recent tickets with real-time updates
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Refs for real-time updates
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);
  const lastTicketCountRef = useRef(0);

  // Fetch stats and recent tickets
  const fetchData = useCallback(async (startDate?: string, endDate?: string, silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      // Fetch stats
      const statsData = await fetchDashboardStats(startDate, endDate);
      setStats(statsData);
      
      // Fetch recent tickets
      const ticketsResponse = await fetchTickets(1, RECENT_TICKETS_COUNT);
      
      if (ticketsResponse && ticketsResponse.tickets) {
        const newTickets = ticketsResponse.tickets;
        
        // ตรวจสอบว่ามีตั๋วใหม่หรือไม่
        if (newTickets.length > lastTicketCountRef.current && lastTicketCountRef.current > 0 && !silent) {
          // แสดงการแจ้งเตือนเมื่อมีตั๋วใหม่
          const newTicketCount = newTickets.length - lastTicketCountRef.current;
          notificationService.success(`ມີປີ້ໃໝ່ ${newTicketCount} ໃບ!`, {
            autoClose: 3000,
          });
        }
        
        setRecentTickets(newTickets);
        lastTicketCountRef.current = newTickets.length;
        setLastUpdate(new Date());
      } else {
        setRecentTickets([]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (!silent) {
        notificationService.error(error?.message || 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ dashboard');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // เพิ่มตั๋วใหม่แบบ optimistic update
  const addNewTicketOptimistic = useCallback((newTicket: Ticket, showNotification = false) => {
    setRecentTickets(prevTickets => {
      // เพิ่มตั๋วใหม่ที่ด้านบน และจำกัดจำนวนตาม RECENT_TICKETS_COUNT
      const updatedTickets = [newTicket, ...prevTickets].slice(0, RECENT_TICKETS_COUNT);
      lastTicketCountRef.current = updatedTickets.length;
      return updatedTickets;
    });

    // อัพเดท stats แบบ optimistic
    setStats(prevStats => ({
      ...prevStats,
      totalTicketsSold: prevStats.totalTicketsSold + 1,
      totalRevenue: prevStats.totalRevenue + newTicket.price
    }));

    setLastUpdate(new Date());
    
    // แสดงการแจ้งเตือนเฉพาะเมื่อต้องการ
    if (showNotification) {
      notificationService.success('ປີ້ໃໝ່ຖືກເພີ່ມແລ້ວ!', {
        autoClose: 2000,
      });
    }
  }, []);

  // Start real-time polling
  const startRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        // เรียกข้อมูลแบบ silent (ไม่แสดง loading)
        fetchData(undefined, undefined, true);
      }
    }, 10000); // อัพเดททุก 10 วินาที
  }, [fetchData]);

  // Stop real-time updates
  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manual refresh
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      
      if (document.hidden) {
        stopRealTimeUpdates();
      } else {
        // รีเฟรชข้อมูลทันทีเมื่อกลับมายังหน้า
        fetchData(undefined, undefined, true);
        startRealTimeUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, startRealTimeUpdates, stopRealTimeUpdates]);

  // Start polling when component mounts
  useEffect(() => {
    startRealTimeUpdates();
    
    return () => {
      stopRealTimeUpdates();
      isActiveRef.current = false;
    };
  }, [startRealTimeUpdates, stopRealTimeUpdates]);

  // Format last update time
  const getLastUpdateText = useCallback(() => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `ອັບເດດເມື່ອ ${diffInSeconds} ວິນາທີທີ່ແລ້ວ`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `ອັບເດດເມື່ອ ${minutes} ນາທີທີ່ແລ້ວ`;
    } else {
      return `ອັບເດດເມື່ອ ${lastUpdate.toLocaleTimeString('lo-LA')}`;
    }
  }, [lastUpdate]);
  
  return {
    stats,
    recentTickets,
    loading,
    lastUpdate,
    fetchData,
    addNewTicketOptimistic,
    refreshData,
    startRealTimeUpdates,
    stopRealTimeUpdates,
    getLastUpdateText
  };
}