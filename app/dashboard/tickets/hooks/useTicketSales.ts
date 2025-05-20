// app/dashboard/tickets/hooks/useTicketSales.ts
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
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [lastTickets, setLastTickets] = useState<Ticket[]>([]);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  // Ref สำหรับการพิมพ์
  const printRef = useRef<HTMLDivElement>(null);
  
  /**
   * ฟังก์ชันเตรียมการขายตั๋ว - เปิด dialog
   */
  const prepareSellTicket = useCallback(() => {
    setShowPrintDialog(true);
  }, []);
  
  /**
   * ฟังก์ชันยกเลิกการขายตั๋ว
   */
  const cancelSellTicket = useCallback(() => {
    setShowPrintDialog(false);
  }, []);
  
  /**
   * ฟังก์ชันพิมพ์ตั๋ว
   */
  const handlePrint = useCallback(() => {
    if (printRef.current) {
      // สร้าง iframe สำหรับพิมพ์
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '80mm';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.body.innerHTML = printRef.current.innerHTML;
        
        // เพิ่ม CSS สำหรับการพิมพ์
        const style = frameDoc.createElement('style');
        style.textContent = `
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; padding: 0; }
        `;
        frameDoc.head.appendChild(style);
        
        // พิมพ์ และลบ iframe หลังจากพิมพ์เสร็จ
        iframe.contentWindow?.print();
        
        // ลบ iframe หลังจากพิมพ์เสร็จ
        setTimeout(() => {
          document.body.removeChild(iframe);
          
          // รีโหลดหน้าหลังจากลบ iframe
          window.location.reload();
        }, 1000);
      }
    }
  }, []);
  
  /**
   * ฟังก์ชันขายตั๋ว ที่ทำงานเมื่อกดปุ่ม Print ใน dialog
   */
  const sellTicket = useCallback(async (copies: number) => {
    setLoading(true);
    try {
      const newTickets: Ticket[] = [];
      
      // สร้างตั๋วตามจำนวนที่เลือก
      for (let i = 0; i < copies; i++) {
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
      
      // ปิด dialog
      setShowPrintDialog(false);
      
      // พิมพ์ตั๋ว
      setTimeout(() => {
        handlePrint();
      }, 500);
      
      // แสดงข้อความแจ้งเตือน
      notificationService.success(
        copies > 1 
          ? `ອອກປີ້ສຳເລັດ ${copies} ໃບ`
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
  }, [ticketPrice, paymentMethod, handlePrint]);
  
  return {
    ticketPrice,
    paymentMethod,
    ticketQuantity,
    setPaymentMethod,
    setTicketQuantity,
    loading,
    lastTickets,
    showPrintDialog,
    prepareSellTicket,
    cancelSellTicket,
    sellTicket,
    printRef
  };
}