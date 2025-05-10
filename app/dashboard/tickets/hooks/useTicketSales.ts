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
  const [loading, setLoading] = useState(false);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  
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
      // สร้างตั๋วใหม่
      const ticketData = {
        price: ticketPrice,
        paymentMethod,
      };
      
      const newTicket = await createTicket(ticketData);
      
      // เก็บข้อมูลตั๋วล่าสุด
      setLastTicket(newTicket);
      
      // พิมพ์ตั๋ว
      requestAnimationFrame(() => {
        handlePrint();
      });
      
      return newTicket;
    } catch (error: any) {
      console.error('Error selling ticket:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການຂາຍປີ້');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [ticketPrice, paymentMethod, handlePrint]);
  
  return {
    ticketPrice,
    paymentMethod,
    setPaymentMethod,
    loading,
    lastTicket,
    sellTicket,
    printRef,
    handlePrint
  };
}