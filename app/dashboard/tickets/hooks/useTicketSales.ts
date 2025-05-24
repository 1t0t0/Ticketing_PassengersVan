// app/dashboard/tickets/hooks/useTicketSales.ts (Updated)
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
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
   * ฟังก์ชันแสดง Modal ยืนยัน
   */
  const showConfirmation = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  /**
   * ฟังก์ชันยกเลิก Modal
   */
  const cancelConfirmation = useCallback(() => {
    setShowConfirmModal(false);
    setQuantity(1); // รีเซ็ตจำนวนเมื่อยกเลิก
  }, []);

  /**
   * ฟังก์ชันเปลี่ยนจำนวนตั๋ว
   */
  const updateQuantity = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  /**
   * ฟังก์ชันยืนยันการขายตั๋ว
   */
  const confirmSellTicket = useCallback(async () => {
    setLoading(true);
    try {
      // ลูปสร้างตั๋วตามจำนวนที่กำหนด
      const tickets: Ticket[] = [];
      
      for (let i = 0; i < quantity; i++) {
        const ticketData = {
          price: ticketPrice,
          paymentMethod,
        };
        
        const newTicket = await createTicket(ticketData);
        tickets.push(newTicket);
      }
      
      // เก็บตั๋วล่าสุดสำหรับการพิมพ์
      if (tickets.length > 0) {
        setLastTicket(tickets[tickets.length - 1]);
      }
      
      // ปิด Modal และรีเซ็ตจำนวน
      setShowConfirmModal(false);
      setQuantity(1);
      
      // แสดงข้อความสำเร็จ
      notificationService.success(`ອອກປີ້ສຳເລັດ ${quantity} ໃບ`);
      
      // พิมพ์ตั๋วทันที
      requestAnimationFrame(() => {
        handlePrint();
      });
      
      return tickets;
    } catch (error: any) {
      console.error('Error selling ticket:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການຂາຍປີ້');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [ticketPrice, paymentMethod, quantity, handlePrint]);
  
  return {
    ticketPrice,
    paymentMethod,
    setPaymentMethod,
    loading,
    lastTicket,
    showConfirmation,
    cancelConfirmation,
    confirmSellTicket,
    showConfirmModal,
    quantity,
    updateQuantity,
    printRef,
    handlePrint
  };
}