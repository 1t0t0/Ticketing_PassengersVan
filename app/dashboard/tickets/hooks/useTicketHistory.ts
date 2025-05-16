// แก้ไขไฟล์ app/dashboard/tickets/hooks/useTicketHistory.ts

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchTickets, deleteTicket } from '../api/ticket';
import { Ticket, TicketFilter, Pagination } from '../types';
import { PAYMENT_METHOD_OPTIONS } from '../config/constants';
import notificationService from '@/lib/notificationService';

/**
 * Hook สำหรับจัดการประวัติตั๋ว
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
    page: 1,
    limit: 10
  });
  
  const router = useRouter();
  
  // กำหนดวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD
  }
  
  // ดึงข้อมูลตั๋ว - ย้ายการประกาศฟังก์ชันขึ้นมาก่อนที่จะใช้
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await searchTickets(filters);
      
      // จัดการกับผลลัพธ์
      if (data.tickets && data.pagination) {
        setTickets(data.tickets);
        setPagination(data.pagination);
      } else {
        setTickets([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 10
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
  }, [filters.page, filters.paymentMethod, filters.startDate, fetchTickets]);
  
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
      updateURL(1, searchFilters.paymentMethod as string);
      
      // แสดงการแจ้งเตือนผลการค้นหา
      if (data.tickets && data.tickets.length > 0) {
        notificationService.success(`ພົບ ${data.tickets.length} ລາຍການ`);
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
      page: 1,
      limit: 10
    };
    
    setFilters(clearedFilters);
    updateURL(1);
    
    // ดึงข้อมูลใหม่
    fetchTickets();
    
    notificationService.info('ລ້າງການຄົ້ນຫາແລ້ວ');
  }, [fetchTickets]);
  
  // อัปเดต URL
  const updateURL = useCallback((page: number, method: string = 'all') => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    
    if (method !== 'all') {
      url.searchParams.set('paymentMethod', method);
    } else {
      url.searchParams.delete('paymentMethod');
    }
    
    router.push(`${url.pathname}${url.search}`);
  }, [router]);
  
  // เปลี่ยนหน้า
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    updateURL(page, filters.paymentMethod as string);
  }, [filters.paymentMethod, updateURL]);
  
  // เปลี่ยนวิธีการชำระเงิน
  const handlePaymentMethodChange = useCallback((method: 'all' | 'cash' | 'qr') => {
    setFilters(prev => ({ ...prev, paymentMethod: method, page: 1 }));
    updateURL(1, method);
  }, [updateURL]);
  
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
    handleSearch,
    handleClear,
    handlePageChange,
    handlePaymentMethodChange,
    handleDeleteTicket,
    refreshTickets
  };
}