// app/dashboard/tickets/hooks/useTicketSales.ts (ปรับปรุง)
import { useState, useRef, useCallback } from 'react';
import { createTicket } from '../api/ticket';
import { DEFAULT_TICKET_PRICE, PAYMENT_METHODS } from '../config/constants';
import { Ticket } from '../types';
import notificationService from '@/lib/notificationService';

/**
 * Hook สำหรับจัดการการขายตั๋ว
 */
export default function useTicketSales() {
  // State
  const [ticketPrice] = useState(DEFAULT_TICKET_PRICE);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>(PAYMENT_METHODS.CASH);
  const [ticketQuantity, setTicketQuantity] = useState<number>(1); // เพิ่ม state สำหรับจำนวนตั๋ว
  const [loading, setLoading] = useState(false);
  const [lastTickets, setLastTickets] = useState<Ticket[]>([]); // เปลี่ยนจาก lastTicket เป็น lastTickets (array)
  
  // Ref สำหรับการพิมพ์
  const printRef = useRef<HTMLDivElement>(null);
  
  /**
   * ฟังก์ชันสำหรับพิมพ์ตั๋ว
   */
  const handlePrint = useCallback(() => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  }, []);
  
  /**
   * ฟังก์ชันขายตั๋ว
   */
  const sellTicket = useCallback(async () => {
    setLoading(true);
    try {
      const newTickets: Ticket[] = [];
      
      // สร้างตั๋วตามจำนวนที่เลือก
      for (let i = 0; i < ticketQuantity; i++) {
        // สร้างตั๋วใหม่
        const ticketData = {
          price: ticketPrice,
          paymentMethod,
        };
        
        const newTicket = await createTicket(ticketData);
        newTickets.push(newTicket);
      }
      
      // เก็บข้อมูลตั๋วล่าสุด
      setLastTickets(newTickets);
      
      // พิมพ์ตั๋ว
      requestAnimationFrame(() => {
        handlePrint();
      });
      
      // แสดงข้อความแจ้งเตือน
      notificationService.success(
        ticketQuantity > 1 
          ? `ອອກປີ້ສຳເລັດ ${ticketQuantity} ໃບ`
          : 'ອອກປີ້ສຳເລັດແລ້ວ'
      );
      
      return newTickets;
    } catch (error: any) {
      console.error('Error selling ticket:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການຂາຍປີ້');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [ticketPrice, paymentMethod, ticketQuantity, handlePrint]);
  
  return {
    ticketPrice,
    paymentMethod,
    ticketQuantity,
    setPaymentMethod,
    setTicketQuantity,
    loading,
    lastTickets,
    sellTicket,
    printRef,
    handlePrint
  };
}