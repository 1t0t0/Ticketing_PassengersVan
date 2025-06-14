// app/dashboard/tickets/hooks/useTicketHistory.ts - Enhanced with Ticket Type filtering
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchTickets, deleteTicket } from '../api/ticket';
import { Ticket, TicketFilter, Pagination } from '../types';
import notificationService from '@/lib/notificationService';

/**
 * Hook สำหรับจัดการประวัติตั๋ว - Enhanced with Ticket Type filtering
 */
export default function useTicketHistory(
  showConfirmation: (message: string, onConfirm: () => void) => void
) {
  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TicketFilter>({
    searchQuery: '',
    startDate: getCurrentDate(), // กำหนดค่าเริ่มต้นเป็นวันนี้
    paymentMethod: 'all',
    ticketType: 'all', // ✅ เพิ่มการกรองตามประเภทตั๋ว
    page: 1,
    limit: 10
  });
  
  // ✅ เพิ่ม state สำหรับสถิติ
  const [statistics, setStatistics] = useState({
    individual: { count: 0, totalRevenue: 0, totalPassengers: 0 },
    group: { count: 0, totalRevenue: 0, totalPassengers: 0 }
  });
  
  const router = useRouter();
  
  // กำหนดวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD
  }
  
  // ดึงข้อมูลตั๋ว - Enhanced with statistics
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchTickets(filters);
      
      // จัดการกับผลลัพธ์
      if (data.tickets && data.pagination) {
        setTickets(data.tickets);
        setPagination(data.pagination);
        
        // ✅ อัพเดทสถิติ
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      } else {
        setTickets([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 10
        });
        setStatistics({
          individual: { count: 0, totalRevenue: 0, totalPassengers: 0 },
          group: { count: 0, totalRevenue: 0, totalPassengers: 0 }
        });
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນປີ້');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // ดึงข้อมูลตั๋วเมื่อ filters เปลี่ยน
  useEffect(() => {
    fetchTickets();
  }, [filters.page, filters.paymentMethod, filters.ticketType, filters.startDate, fetchTickets]);
  
  // ฟังก์ชัน refreshTickets สำหรับรีเฟรชข้อมูล
  const refreshTickets = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);
  
  // ค้นหาตั๋ว
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const searchFilters = { ...filters, page: 1 }; // รีเซ็ตหน้าเป็นหน้าแรกเมื่อค้นหา
      setFilters(searchFilters);
      
      const data = await searchTickets(searchFilters);
      
      // จัดการกับผลลัพธ์
      if (data.tickets && data.pagination) {
        setTickets(data.tickets);
        setPagination(data.pagination);
        
        // ✅ อัพเดทสถิติ
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      } else {
        setTickets([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 10
        });
      }
      
      // อัปเดต URL
      updateURL(1, searchFilters.paymentMethod as string, searchFilters.ticketType as string);
      
      // แสดงการแจ้งเตือนผลการค้นหา
      if (data.tickets && data.tickets.length > 0) {
        const totalPassengers = data.tickets.reduce((sum, ticket) => sum + (ticket.passengerCount || 1), 0);
        notificationService.success(`ພົບ ${data.tickets.length} ປີ້ (${totalPassengers} ຄົນ)`);
      } else {
        notificationService.info('ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການຄົ້ນຫາ');
      }
    } catch (error: any) {
      console.error('Error searching tickets:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາ');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // ล้างการค้นหา
  const handleClear = useCallback(() => {
    const clearedFilters = {
      searchQuery: '',
      startDate: getCurrentDate(), // เมื่อล้างการค้นหา ให้กลับไปใช้วันที่ปัจจุบัน
      paymentMethod: 'all',
      ticketType: 'all', // ✅ รีเซ็ตประเภทตั๋ว
      page: 1,
      limit: 10
    };
    
    setFilters(clearedFilters);
    updateURL(1);
    
    // ดึงข้อมูลใหม่
    fetchTickets();
    
    notificationService.info('ລ້າງການຄົ້ນຫາແລ້ວ');
  }, [fetchTickets]);
  
  // อัปเดต URL - Enhanced with ticket type
  const updateURL = useCallback((
    page: number, 
    method: string = 'all', 
    ticketType: string = 'all'
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    
    if (method !== 'all') {
      url.searchParams.set('paymentMethod', method);
    } else {
      url.searchParams.delete('paymentMethod');
    }
    
    // ✅ เพิ่มการจัดการ ticketType ใน URL
    if (ticketType !== 'all') {
      url.searchParams.set('ticketType', ticketType);
    } else {
      url.searchParams.delete('ticketType');
    }
    
    router.push(`${url.pathname}${url.search}`);
  }, [router]);
  
  // เปลี่ยนหน้า
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    updateURL(page, filters.paymentMethod as string, filters.ticketType as string);
  }, [filters.paymentMethod, filters.ticketType, updateURL]);
  
  // เปลี่ยนวิธีการชำระเงิน
  const handlePaymentMethodChange = useCallback((method: 'all' | 'cash' | 'qr') => {
    setFilters(prev => ({ ...prev, paymentMethod: method, page: 1 }));
    updateURL(1, method, filters.ticketType as string);
  }, [filters.ticketType, updateURL]);
  
  // ✅ เพิ่มฟังก์ชันเปลี่ยนประเภทตั๋ว
  const handleTicketTypeChange = useCallback((ticketType: 'all' | 'individual' | 'group') => {
    setFilters(prev => ({ ...prev, ticketType, page: 1 }));
    updateURL(1, filters.paymentMethod as string, ticketType);
  }, [filters.paymentMethod, updateURL]);
  
  // ลบตั๋ว
  const handleDeleteTicket = useCallback((ticketId: string, ticketNumber: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບປີ້ເລກທີ ${ticketNumber}?`, async () => {
      try {
        await deleteTicket(ticketId);
        
        // รีโหลดข้อมูลหลังลบ
        fetchTickets();
        notificationService.success('ລຶບປີ້ສຳເລັດແລ້ວ');
      } catch (error: any) {
        console.error('Error deleting ticket:', error);
        notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການລຶບປີ້');
      }
    });
  }, [fetchTickets, showConfirmation]);
  
  return {
    tickets,
    pagination,
    loading,
    filters,
    setFilters,
    statistics, // ✅ เพิ่ม statistics
    handleSearch,
    handleClear,
    handlePageChange,
    handlePaymentMethodChange,
    handleTicketTypeChange, // ✅ เพิ่มฟังก์ชันใหม่
    handleDeleteTicket,
    refreshTickets
  };
}