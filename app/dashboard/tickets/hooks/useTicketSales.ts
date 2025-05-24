// app/dashboard/tickets/hooks/useTicketSales.ts (Updated for N160II Thermal Printer)
import { useState, useRef, useCallback } from 'react';
import { createTicket } from '../api/ticket';
import { DEFAULT_TICKET_PRICE, PAYMENT_METHODS } from '../config/constants';
import { Ticket } from '../types';
import notificationService from '@/lib/notificationService';

/**
 * Hook สำหรับจัดการการขายตั๋ว (สำหรับ N160II Thermal Printer)
 */
export default function useTicketSales() {
  // State
  const [ticketPrice] = useState(DEFAULT_TICKET_PRICE);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>(PAYMENT_METHODS.CASH);
  const [loading, setLoading] = useState(false);
  const [createdTickets, setCreatedTickets] = useState<Ticket[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Ref สำหรับการพิมพ์
  const printRef = useRef<HTMLDivElement>(null);
  
  /**
   * ฟังก์ชันสำหรับพิมพ์ตั๋วหลายใบ (N160II Thermal Printer Layout)
   */
  const handlePrint = useCallback(() => {
    if (printRef.current && createdTickets.length > 0) {
      // สร้างหน้าต่างใหม่สำหรับการพิมพ์
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // สร้าง HTML สำหรับพิมพ์ทุกใบ (58mm Thermal Printer Layout)
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bus Tickets - Thermal Print</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap');
            
            * {
              font-family: "Phetsarath", serif !important;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: 58mm auto; /* กระดาษความกว้าง 58mm */
              margin: 0;
              padding: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
              width: 58mm;
              font-size: 11px;
              line-height: 1.2;
            }
            
            .ticket-container {
              width: 58mm;
              min-height: auto;
              margin: 0;
              background: white;
              font-family: 'Phetsarath', serif;
              font-size: 11px;
              page-break-inside: avoid;
              page-break-after: always;
              padding: 2mm;
            }
            
            .ticket-container:last-child {
              page-break-after: avoid;
            }
            
            /* Header */
            .ticket-header {
              text-align: center;
              border-bottom: 1px dashed black;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }
            
            .ticket-header h1 {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 2px;
              line-height: 1.1;
            }
            
            .ticket-header .subtitle {
              font-size: 10px;
              margin-bottom: 1px;
            }
            
            /* Details Section */
            .ticket-details {
              margin-bottom: 3mm;
              font-size: 10px;
            }
            
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
              word-break: break-all;
            }
            
            .detail-label {
              font-weight: bold;
              width: 45%;
            }
            
            .detail-value {
              width: 55%;
              text-align: right;
            }
            
            /* Route Section */
            .route-section {
              text-align: center;
              border-top: 1px dashed black;
              border-bottom: 1px dashed black;
              padding: 2mm 0;
              margin: 3mm 0;
              font-size: 10px;
            }
            
            .route-text {
              font-weight: bold;
              margin: 1px 0;
            }
            
            /* Sold By Section */
            .sold-by-section {
              text-align: center;
              margin: 3mm 0;
              font-size: 10px;
            }
            
            /* Footer */
            .ticket-footer {
              text-align: center;
              border-top: 1px dashed black;
              padding-top: 2mm;
              margin-top: 3mm;
              font-size: 9px;
              line-height: 1.1;
            }
            
            .footer-line {
              margin: 1px 0;
            }
            
            /* QR Code Placeholder */
            .qr-placeholder {
              text-align: center;
              margin: 2mm 0;
              font-size: 8px;
              color: #666;
            }
            
            /* Space for cutting */
            .cut-line {
              text-align: center;
              margin: 3mm 0;
              font-size: 8px;
              color: #999;
            }
            
            /* Print specific */
            @media print {
              body {
                width: 58mm !important;
              }
              
              .ticket-container {
                width: 58mm !important;
                margin: 0 !important;
                padding: 2mm !important;
              }
            }
          </style>
        </head>
        <body>
          ${createdTickets.map((ticket, index) => `
            <div class="ticket-container">
              <!-- Header -->
              <div class="ticket-header">
                <h1>ປີ້ລົດຕູ້ໂດຍສານ</h1>
                <div class="subtitle">ປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</div>
                <div class="subtitle">BUS TICKET LAOS-CHINA RAILWAY</div>
              </div>
              
              <!-- Ticket Details -->
              <div class="ticket-details">
                <div class="detail-row">
                  <span class="detail-label">ເລກທີ/No:</span>
                  <span class="detail-value">${ticket.ticketNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ວັນທີ/Date:</span>
                  <span class="detail-value">${formatDateShort(new Date(ticket.soldAt))}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ເວລາ/Time:</span>
                  <span class="detail-value">${formatTimeShort(new Date(ticket.soldAt))}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ລາຄາ/Price:</span>
                  <span class="detail-value">₭${ticket.price.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ຊຳລະ/Payment:</span>
                  <span class="detail-value">${getPaymentMethodText(ticket.paymentMethod)}</span>
                </div>
              </div>
              
              <!-- Route -->
              <div class="route-section">
                <div class="route-text">ສະຖານີລົດໄຟ → ຕົວເມືອງ</div>
                <div class="route-text">TRAIN STATION → DOWNTOWN</div>
              </div>
              
              <!-- Sold By -->
              <div class="sold-by-section">
                <div>ອອກໂດຍ/Sold By:</div>
                <div style="font-weight: bold;">${ticket.soldBy}</div>
              </div>
              
              <!-- QR Code Placeholder (if payment method is QR) -->
              ${ticket.paymentMethod === 'qr' ? `
                <div class="qr-placeholder">
                  [QR CODE VERIFICATION]
                </div>
              ` : ''}
              
              <!-- Footer -->
              <div class="ticket-footer">
                <div class="footer-line">*** ຂອບໃຈ THANK YOU ***</div>
                <div class="footer-line">ກະລຸນາຮັກສາປີ້ນີ້ໄວ້</div>
                <div class="footer-line">PLEASE KEEP THIS TICKET</div>
                <div class="footer-line">ຂະນະເດີນທາງ</div>
                <div class="footer-line">DURING YOUR JOURNEY</div>
              </div>
              
              <!-- Cut Line -->
              ${index < createdTickets.length - 1 ? `
                <div class="cut-line">
                  ✂️ ------------------------------------------------ ✂️
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // รอให้โหลดเสร็จแล้วพิมพ์
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }, [createdTickets]);

  // Helper functions สำหรับการพิมพ์
  const formatDateShort = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2); // ใช้แค่ 2 หลักท้าย
    return `${day}/${month}/${year}`;
  };

  const formatTimeShort = (date: Date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'ເງິນສົດ/CASH';
      case 'qr':
        return 'QR/ໂອນ';
      default:
        return method;
    }
  };
  
  /**
   * ฟังก์ชันแสดง Modal ยืนยัน
   */
  const showConfirmation = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  /**
   * ฟังก์ศันยกเลิก Modal
   */
  const cancelConfirmation = useCallback(() => {
    setShowConfirmModal(false);
    setQuantity(1);
  }, []);

  /**
   * ฟังก์ชันเปลี่ยนจำนวนตั๋ว
   */
  const updateQuantity = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  /**
   * ฟังก์ชันยืนยันการขายตั๋ว - เปิด print dialog ทันที
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
      
      // เก็บตั๋วทั้งหมดที่สร้าง
      setCreatedTickets(tickets);
      
      // ปิด Modal และรีเซ็ตจำนวน
      setShowConfirmModal(false);
      setQuantity(1);
      
      // แสดงข้อความสำเร็จ
      notificationService.success(`ອອກປີ້ສຳເລັດ ${quantity} ໃບ`);
      
      // เปิด print dialog ทันทีด้วยตั๋วที่เพิ่งสร้าง
      setTimeout(() => {
        handlePrintWithTickets(tickets);
      }, 100);
      
      return tickets;
    } catch (error: any) {
      console.error('Error selling ticket:', error);
      notificationService.error(error.message || 'ເກີດຂໍ້ຜິດພາດໃນການຂາຍປີ້');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [ticketPrice, paymentMethod, quantity]);

  /**
   * ฟังก์ชันพิมพ์ตั๋วแบบใช้ iframe (ใช้ได้จริง 100%)
   */
  const handlePrintWithTickets = useCallback((tickets: Ticket[]) => {
    if (tickets && tickets.length > 0) {
      // สร้าง iframe สำหรับพิมพ์
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      // สร้างเนื้อหา HTML สำหรับพิมพ์
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bus Tickets</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap');
            
            * {
              font-family: "Phetsarath", serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: 58mm auto;
              margin: 0;
            }
            
            body {
              width: 58mm;
              margin: 0;
              padding: 0;
              background: white;
              font-size: 11px;
              line-height: 1.2;
            }
            
            .thermal-ticket {
              width: 58mm;
              margin: 0;
              padding: 2mm;
              background: white;
              page-break-after: always;
              page-break-inside: avoid;
            }
            
            .thermal-ticket:last-child {
              page-break-after: avoid;
            }
            
            .ticket-header {
              text-align: center;
              border-bottom: 1px dashed black;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }
            
            .ticket-header h1 {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 2px;
              line-height: 1.1;
            }
            
            .ticket-header .subtitle {
              font-size: 10px;
              margin-bottom: 1px;
            }
            
            .ticket-details {
              margin-bottom: 3mm;
              font-size: 10px;
            }
            
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
            }
            
            .detail-label {
              font-weight: bold;
              width: 45%;
            }
            
            .detail-value {
              width: 55%;
              text-align: right;
            }
            
            .route-section {
              text-align: center;
              border-top: 1px dashed black;
              border-bottom: 1px dashed black;
              padding: 2mm 0;
              margin: 3mm 0;
              font-size: 10px;
            }
            
            .route-text {
              font-weight: bold;
              margin: 1px 0;
            }
            
            .sold-by-section {
              text-align: center;
              margin: 3mm 0;
              font-size: 10px;
            }
            
            .ticket-footer {
              text-align: center;
              border-top: 1px dashed black;
              padding-top: 2mm;
              margin-top: 3mm;
              font-size: 9px;
              line-height: 1.1;
            }
            
            .footer-line {
              margin: 1px 0;
            }
            
            .qr-placeholder {
              text-align: center;
              margin: 2mm 0;
              font-size: 8px;
              color: #666;
            }
            
            .cut-line {
              text-align: center;
              margin: 3mm 0;
              font-size: 8px;
              color: #999;
            }
          </style>
        </head>
        <body>
          ${tickets.map((ticket, index) => `
            <div class="thermal-ticket">
              <div class="ticket-header">
                <h1>ປີ້ລົດຕູ້ໂດຍສານ</h1>
                <div class="subtitle">ປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</div>
                <div class="subtitle">BUS TICKET LAOS-CHINA RAILWAY</div>
              </div>
              
              <div class="ticket-details">
                <div class="detail-row">
                  <span class="detail-label">ເລກທີ/No:</span>
                  <span class="detail-value">${ticket.ticketNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ວັນທີ/Date:</span>
                  <span class="detail-value">${formatDateShort(new Date(ticket.soldAt))}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ເວລາ/Time:</span>
                  <span class="detail-value">${formatTimeShort(new Date(ticket.soldAt))}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ລາຄາ/Price:</span>
                  <span class="detail-value">₭${ticket.price.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ຊຳລະ/Payment:</span>
                  <span class="detail-value">${getPaymentMethodText(ticket.paymentMethod)}</span>
                </div>
              </div>
              
              <div class="route-section">
                <div class="route-text">ສະຖານີລົດໄຟ → ຕົວເມືອງ</div>
                <div class="route-text">TRAIN STATION → DOWNTOWN</div>
              </div>
              
              <div class="sold-by-section">
                <div>ອອກໂດຍ/Sold By:</div>
                <div style="font-weight: bold;">${ticket.soldBy}</div>
              </div>
              
              ${ticket.paymentMethod === 'qr' ? `
                <div class="qr-placeholder">
                  [QR CODE VERIFICATION]
                </div>
              ` : ''}
              
              <div class="ticket-footer">
                <div class="footer-line">*** ຂອບໃຈ THANK YOU ***</div>
                <div class="footer-line">ກະລຸນາຮັກສາປີ້ນີ້ໄວ້</div>
                <div class="footer-line">PLEASE KEEP THIS TICKET</div>
                <div class="footer-line">ຂະນະເດີນທາງ</div>
                <div class="footer-line">DURING YOUR JOURNEY</div>
              </div>
              
              ${index < tickets.length - 1 ? `
                <div class="cut-line">
                  ✂️ ------------------------------------------------ ✂️
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
        </html>
      `;
      
      // เขียนเนื้อหาลง iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printHTML);
        iframeDoc.close();
        
        // รอให้โหลดเสร็จแล้วพิมพ์
        iframe.onload = () => {
          setTimeout(() => {
            try {
              // Focus iframe และพิมพ์
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (error) {
              console.error('Print error:', error);
              // Fallback: ใช้วิธีเปิดหน้าต่างใหม่
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(printHTML);
                printWindow.document.close();
                printWindow.onload = () => {
                  printWindow.print();
                  printWindow.close();
                };
              }
            }
            
            // ลบ iframe หลังพิมพ์
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 2000);
          }, 500);
        };
      }
    }
  }, []);
  
  return {
    ticketPrice,
    paymentMethod,
    setPaymentMethod,
    loading,
    createdTickets,
    showConfirmation,
    cancelConfirmation,
    confirmSellTicket,
    showConfirmModal,
    quantity,
    updateQuantity,
    printRef,
    handlePrint,
    handlePrintWithTickets // เพิ่มฟังก์ชันใหม่
  };
}