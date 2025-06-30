// app/dashboard/tickets/hooks/useTicketHistory.ts - FIXED Date Filtering Issue
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchTickets, deleteTicket } from '../api/ticket';
import { Ticket, TicketFilter, Pagination } from '../types';
import notificationService from '@/lib/notificationService';

/**
 * Hook สำหรับจัดการประวัติตั๋ว - FIXED with proper date filtering
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
  
  // ✅ FIXED: Initialize with today's date as default filter
  const [filters, setFilters] = useState<TicketFilter>({
    searchQuery: '',
    startDate: getCurrentDate(), // ✅ Default to today
    paymentMethod: 'all',
    ticketType: 'all',
    page: 1,
    limit: 10
  });
  
  // ✅ เพิ่ม state สำหรับสถิติ
  const [statistics, setStatistics] = useState({
    individual: { count: 0, totalRevenue: 0, totalPassengers: 0 },
    group: { count: 0, totalRevenue: 0, totalPassengers: 0 }
  });
  
  const router = useRouter();
  
  // ✅ CRITICAL: Get current date in Thailand timezone
  function getCurrentDate() {
    const today = new Date();
    // Ensure we get the date in Thailand timezone (UTC+7)
    const thailandTime = new Date(today.getTime() + (7 * 60 * 60 * 1000));
    return thailandTime.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }
  
  // ✅ CRITICAL FIX: ดึงข้อมูลตั๋ว - Enhanced with mandatory date filtering
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ CRITICAL: Always ensure we have a date filter to prevent loading all tickets
      let searchFilters = { ...filters };
      
      // If no startDate is provided, force today's date
      if (!searchFilters.startDate || searchFilters.startDate.trim() === '') {
        searchFilters.startDate = getCurrentDate();
        console.log('⚠️ No start date provided, using today:', searchFilters.startDate);
      }
      
      console.log('📊 Fetching tickets with filters:', {
        startDate: searchFilters.startDate,
        searchQuery: searchFilters.searchQuery,
        paymentMethod: searchFilters.paymentMethod,
        ticketType: searchFilters.ticketType,
        page: searchFilters.page
      });
      
      const data = await searchTickets(searchFilters);
      
      // จัดการกับผลลัพธ์
      if (data.tickets && data.pagination) {
        setTickets(data.tickets);
        setPagination(data.pagination);
        
        // ✅ อัพเดทสถิติ
        if (data.statistics) {
          setStatistics(data.statistics);
        }
        
        console.log(`✅ Successfully loaded ${data.tickets.length} tickets for date: ${searchFilters.startDate}`);
        console.log(`📊 Total items in pagination: ${data.pagination.totalItems}`);
        
        // ✅ Update filters state if we forced a date
        if (searchFilters.startDate !== filters.startDate) {
          setFilters(prev => ({ ...prev, startDate: searchFilters.startDate }));
        }
      } else {
        console.log('⚠️ No tickets data received');
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
      console.error('❌ Error fetching tickets:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນປີ້');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // ✅ FIXED: ดึงข้อมูลตั๋วเมื่อ filters เปลี่ยน - with proper dependency
  useEffect(() => {
    fetchTickets();
  }, [filters.page, filters.paymentMethod, filters.ticketType, filters.startDate, fetchTickets]);
  
  // ฟังก์ชัน refreshTickets สำหรับรีเฟรชข้อมูล
  const refreshTickets = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    fetchTickets();
  }, [fetchTickets]);
  
  // ✅ FIXED: ค้นหาตั๋ว - Enhanced with better date handling
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Force reset to page 1 when searching + ensure date filter
      const searchFilters = { 
        ...filters, 
        page: 1,
        // If no date provided, use today
        startDate: filters.startDate || getCurrentDate()
      };
      
      console.log('🔍 Performing search with filters:', searchFilters);
      
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
        
        console.log(`🔍 Search completed: ${data.tickets.length} tickets found`);
        
        // แสดงการแจ้งเตือนผลการค้นหา
        if (data.tickets && data.tickets.length > 0) {
          const totalPassengers = data.tickets.reduce((sum, ticket) => sum + (ticket.passengerCount || 1), 0);
          notificationService.success(`ພົບ ${data.tickets.length} ປີ້ (${totalPassengers} ຄົນ) ວັນທີ ${searchFilters.startDate}`);
        } else {
          notificationService.info(`ບໍ່ພົບຂໍ້ມູນວັນທີ ${searchFilters.startDate}`);
        }
      } else {
        setTickets([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 10
        });
        notificationService.info('ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການຄົ້ນຫາ');
      }
      
      // อัปเดต URL
      updateURL(1, searchFilters.paymentMethod as string, searchFilters.ticketType as string);
      
    } catch (error: any) {
      console.error('❌ Error searching tickets:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາ');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // ✅ FIXED: ล้างการค้นหา - Reset to today's date
  const handleClear = useCallback(() => {
    console.log('🧹 Clearing search filters');
    
    const clearedFilters = {
      searchQuery: '',
      startDate: getCurrentDate(), // ✅ Reset to today
      paymentMethod: 'all',
      ticketType: 'all',
      page: 1,
      limit: 10
    };
    
    console.log('🧹 Cleared filters:', clearedFilters);
    
    setFilters(clearedFilters);
    updateURL(1);
    
    notificationService.info('ລ້າງການຄົ້ນຫາແລ້ວ - ກັບໄປສູ່ວັນທີ່ປັດຈຸບັນ');
  }, []);
  
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
    
    // ✅ Add date to URL for better bookmarking
    if (filters.startDate && filters.startDate !== getCurrentDate()) {
      url.searchParams.set('date', filters.startDate);
    } else {
      url.searchParams.delete('date');
    }
    
    router.push(`${url.pathname}${url.search}`);
  }, [filters.startDate, router]);
  
  // เปลี่ยนหน้า
  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Changing to page:', page);
    setFilters(prev => ({ ...prev, page }));
    updateURL(page, filters.paymentMethod as string, filters.ticketType as string);
  }, [filters.paymentMethod, filters.ticketType, updateURL]);
  
  // เปลี่ยนวิธีการชำระเงิน
  const handlePaymentMethodChange = useCallback((method: 'all' | 'cash' | 'qr') => {
    console.log('💳 Changing payment method to:', method);
    setFilters(prev => ({ ...prev, paymentMethod: method, page: 1 }));
    updateURL(1, method, filters.ticketType as string);
  }, [filters.ticketType, updateURL]);
  
  // ✅ เพิ่มฟังก์ชันเปลี่ยนประเภทตั๋ว
  const handleTicketTypeChange = useCallback((ticketType: 'all' | 'individual' | 'group') => {
    console.log('🎫 Changing ticket type to:', ticketType);
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

  // ✅ NEW: Function to change date filter specifically
  const handleDateChange = useCallback((newDate: string) => {
    console.log('📅 Changing date filter to:', newDate);
    setFilters(prev => ({ 
      ...prev, 
      startDate: newDate,
      page: 1 // Reset to first page when changing date
    }));
  }, []);

  // ✅ NEW: Function to get tickets for today specifically
  const loadTodayTickets = useCallback(() => {
    console.log('📅 Loading today\'s tickets');
    const today = getCurrentDate();
    setFilters(prev => ({ 
      ...prev, 
      startDate: today,
      page: 1,
      searchQuery: '' // Clear search when loading today
    }));
  }, []);
  
  return {
    tickets,
    pagination,
    loading,
    filters,
    setFilters,
    statistics,
    handleSearch,
    handleClear,
    handlePageChange,
    handlePaymentMethodChange,
    handleTicketTypeChange,
    handleDeleteTicket,
    refreshTickets,
    
    // ✅ NEW: Additional functions for better date handling
    handleDateChange,
    loadTodayTickets,
    getCurrentDate
  };
}