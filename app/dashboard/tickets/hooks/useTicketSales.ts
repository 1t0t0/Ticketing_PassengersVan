// app/dashboard/tickets/hooks/useTicketSales.ts - Enhanced with Group Ticket Support
import { useState, useCallback } from 'react';
import { createTicket } from '../api/ticket';
import { DEFAULT_TICKET_PRICE, PAYMENT_METHODS } from '../config/constants';
import { Ticket } from '../types';
import notificationService from '@/lib/notificationService';

/**
 * Hook สำหรับจัดการการขายตั๋ว พร้อม Group Ticket Support และ QR Code
 */
export default function useTicketSales() {
  // State
  const [ticketPrice] = useState(DEFAULT_TICKET_PRICE);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>(PAYMENT_METHODS.CASH);
  const [loading, setLoading] = useState(false);
  const [createdTickets, setCreatedTickets] = useState<Ticket[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // ✅ เพิ่ม State สำหรับ Group Ticket
  const [ticketType, setTicketType] = useState<'individual' | 'group'>('individual');
  
  // Helper functions สำหรับการพิมพ์
  const formatDateShort = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
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

  // ✅ ฟังก์ชันสร้าง QR Code Data สำหรับ Group Ticket
  const generateQRCodeData = (ticket: Ticket) => {
    if (ticket.ticketType === 'group') {
      // สำหรับ Group Ticket ให้ส่งข้อมูลครบถ้วน
      return JSON.stringify({
        ticketNumber: ticket.ticketNumber,
        ticketType: 'group',
        passengerCount: ticket.passengerCount,
        totalPrice: ticket.price,
        pricePerPerson: ticket.pricePerPerson,
        soldAt: ticket.soldAt,
        paymentMethod: ticket.paymentMethod,
        soldBy: ticket.soldBy,
        validationKey: `GRP-${ticket.ticketNumber}-${new Date(ticket.soldAt).getTime()}`
      });
    } else {
      // สำหรับ Individual Ticket ใช้แค่ ticketNumber
      return ticket.ticketNumber;
    }
  };

  // ฟังก์ชันสร้าง QR Code SVG
  const generateQRCodeSVG = async (data: string) => {
    try {
      const QRCode = await import('qrcode');
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 200,                    // ✅ เพิ่มขนาดสำหรับ Group Ticket
        margin: 4,                     
        errorCorrectionLevel: 'H',     
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
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
    setQuantity(ticketType === 'group' ? 2 : 1); // ✅ รีเซ็ตตามประเภทตั๋ว
  }, [ticketType]);

  /**
   * ฟังก์ชันเปลี่ยนจำนวนตั๋ว/คน
   */
  const updateQuantity = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  /**
   * ✅ ฟังก์ชันเปลี่ยนประเภทตั๋ว
   */
  const updateTicketType = useCallback((type: 'individual' | 'group') => {
    setTicketType(type);
    // ปรับ quantity ให้เหมาะสมกับประเภทตั๋ว
    if (type === 'group' && quantity < 2) {
      setQuantity(2); // กลุ่มขั้นต่ำ 2 คน
    } else if (type === 'individual' && quantity > 50) {
      setQuantity(1); // ปกติเริ่มต้น 1 ใบ
    }
  }, [quantity]);

  /**
   * ฟังก์ชันยืนยันการขายตั๋ว - รองรับ Group Ticket
   */
  const confirmSellTicket = useCallback(async () => {
    setLoading(true);
    try {
      let tickets: Ticket[] = [];
      
      if (ticketType === 'group') {
        // ✅ สำหรับ Group Ticket: สร้าง 1 ใบสำหรับหลายคน
        const groupTicketData = {
          price: ticketPrice * quantity,      // ราคารวม
          paymentMethod,
          ticketType: 'group' as const,
          passengerCount: quantity,           // จำนวนคน
          pricePerPerson: ticketPrice         // ราคาต่อคน
        };
        
        const groupTicket = await createTicket(groupTicketData);
        tickets.push(groupTicket);
        
        notificationService.success(`ອອກປີ້ກຸ່ມສຳເລັດ: ${quantity} ຄົນ`);
      } else {
        // ✅ สำหรับ Individual Ticket: สร้างหลายใบ
        for (let i = 0; i < quantity; i++) {
          const individualTicketData = {
            price: ticketPrice,
            paymentMethod,
            ticketType: 'individual' as const,
            passengerCount: 1,
            pricePerPerson: ticketPrice
          };
          
          const individualTicket = await createTicket(individualTicketData);
          tickets.push(individualTicket);
        }
        
        notificationService.success(`ອອກປີ້ສຳເລັດ ${quantity} ໃບ`);
      }
      
      // เก็บตั๋วทั้งหมดที่สร้าง
      setCreatedTickets(tickets);
      
      // ปิด Modal และรีเซ็ตจำนวน
      setShowConfirmModal(false);
      setQuantity(ticketType === 'group' ? 2 : 1);
      
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
  }, [ticketPrice, paymentMethod, quantity, ticketType]);

  /**
   * ฟังก์ชันพิมพ์ตั๋วแบบใช้ iframe พร้อม QR Code - รองรับ Group Ticket
   */
  const handlePrintWithTickets = useCallback(async (tickets: Ticket[]) => {
    if (tickets && tickets.length > 0) {
      // สร้าง QR Code สำหรับแต่ละตั๋ว
      const ticketsWithQR = await Promise.all(
        tickets.map(async (ticket) => {
          const qrData = generateQRCodeData(ticket);
          const qrCodeImage = await generateQRCodeSVG(qrData);
          return { ...ticket, qrCodeImage };
        })
      );

      // สร้าง iframe สำหรับพิมพ์
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      // สร้างเนื้อหา HTML สำหรับพิมพ์ พร้อม QR Code
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bus Tickets with QR Code</title>
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
              size: 80mm auto;
              margin: 0;
            }
            
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              background: white;
              font-size: 12px;
              line-height: 1.3;
            }
            
            .receipt-container {
              width: 80mm;
              margin: 0;
              padding: 3mm;
              background: white;
              page-break-after: always;
              page-break-inside: avoid;
            }
            
            .receipt-container:last-child {
              page-break-after: avoid;
            }
            
            .receipt-header {
              text-align: center;
            }
            
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            
            .company-subtitle {
              font-size: 14px;
              margin-bottom: 1px;
            }
            
            .divider {
              border-top: 1px solid black;
              margin: 0.5mm 0;
            }
            
            .content-section {
              margin: 4mm 0;
            }
            
            .detail-item {
              display: flex;
              align-items: center;
              margin-bottom: 1mm;
              font-size: 12px;
              position: relative;
            }
            
            .detail-label {
              font-weight: normal;
              width: 45%;
              text-align: left;
            }
            
            .detail-colon {
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(128, 128, 128, 0.1);
              padding: 1px 3px;
              border-radius: 2px;
              font-weight: bold;
            }
            
            .detail-value {
              font-weight: bold;
              width: 45%;
              text-align: right;
              margin-left: auto;
            }
            
            /* ✅ Styles สำหรับ Group Ticket */
            .group-ticket-header {
              background: #e8f5e8;
              border: 2px solid #4ade80;
              border-radius: 4px;
              padding: 3mm;
              margin-bottom: 2mm;
              text-align: center;
            }
            
            .group-badge {
              background: #4ade80;
              color: white;
              padding: 2px 6px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: bold;
              display: inline-block;
              margin-bottom: 2px;
            }
            
            .passenger-count {
              font-size: 18px;
              font-weight: bold;
              color: #16a34a;
            }
            
            .qr-section {
              text-align: center;
              margin: 0mm 0;
              background: #f8f9fa;
              border-radius: 4px;
            }
            
            .qr-code {
              margin: 2mm 0;
            }
            
            .qr-code img {
              width: 200px;
              height: 200px;
              border: 1px solid #ddd;
              background: white;
              padding: 2px;
            }
            
            .qr-label {
              font-size: 10px;
              color: #666;
              font-weight: bold;
              margin-bottom: 2px;
            }
            
            .qr-note {
              font-size: 12px;
              color: #888;
              line-height: 1.2;
            }
            
            .receipt-footer {
              text-align: center;
              margin-top: 2mm;
              font-size: 13px;
              font-weight: bold;
              color: #666;
            }
            
            .cut-line {
              text-align: center;
              margin: 4mm 0;
              font-size: 8px;
              color: #999;
            }
          </style>
        </head>
        <body>
          ${ticketsWithQR.map((ticket, index) => `
            <div class="receipt-container">
              <div class="receipt-header">
                <div class="company-name">ປີ້ລົດຕູ້ໂດຍສານ</div>
                <div class="company-name">ປະຈຳສະຖານີລົດໄຟຫຼວງພະບາງ</div>
                <div class="company-subtitle">Passenger Van Ticket</div>
                <div class="company-subtitle">at Luang Prabang Railway Station</div>
              </div>
              
              <div class="divider"></div>
              
              ${ticket.ticketType === 'group' ? `
                <div class="group-ticket-header">
                  <div class="group-badge">ປີ້ກຸ່ມ GROUP TICKET</div>
                  <div class="passenger-count">${ticket.passengerCount} ຄົນ / ${ticket.passengerCount} Persons</div>
                </div>
              ` : ''}
              
              <div class="content-section">
                <div class="detail-item">
                  <span class="detail-label">ເລກທີ/No</span>
                  <span class="detail-colon">:</span>
                  <span class="detail-value">${ticket.ticketNumber}</span>
                </div>
                
                ${ticket.ticketType === 'group' ? `
                  <div class="detail-item">
                    <span class="detail-label">ຈຳນວນຄົນ/Persons</span>
                    <span class="detail-colon">:</span>
                    <span class="detail-value">${ticket.passengerCount} ຄົນ</span>
                  </div>
                  
                  <div class="detail-item">
                    <span class="detail-label">ລາຄາ/ຄົນ/Per Person</span>
                    <span class="detail-colon">:</span>
                    <span class="detail-value">₭${ticket.pricePerPerson.toLocaleString()}</span>
                  </div>
                ` : ''}
                
                <div class="detail-item">
                  <span class="detail-label">ວັນເວລາ/DateTime</span>
                  <span class="detail-colon">:</span>
                  <span class="detail-value">${formatDateShort(new Date(ticket.soldAt))}/${formatTimeShort(new Date(ticket.soldAt))}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">ລາຄາລວມ/Total</span>
                  <span class="detail-colon">:</span>
                  <span class="detail-value">₭${ticket.price.toLocaleString()}</span>
                </div>
                
                <div class="detail-item">
                  <span class="detail-label">ຊຳລະ/Payment</span>
                  <span class="detail-colon">:</span>
                  <span class="detail-value">${getPaymentMethodText(ticket.paymentMethod)}</span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">ອອກໂດຍ/Sold By</span>
                  <span class="detail-colon">:</span>
                  <span class="detail-value">${ticket.soldBy || 'System'}</span>
                </div>
                
              </div>
              
              <div class="divider"></div>
              
              <div class="content-section" style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 0mm;">ສະຖານີລົດໄຟ → ຕົວເມືອງ</div>
                <div style="font-weight: bold;">TRAIN STATION → DOWNTOWN</div>
              </div>
              
              <div class="divider"></div>
              
              ${ticket.qrCodeImage ? `
                <div class="qr-section">
                  <div class="qr-code">
                    <img src="${ticket.qrCodeImage}" alt="QR Code" />
                  </div>
                  <div class="qr-note">
                    <strong>${ticket.ticketType === 'group' ? 'QR ສຳລັບກຸ່ມ' : 'QR ສຳລັບພະນັກງານຂັບລົດ'}</strong><br>
                    ${ticket.ticketType === 'group' ? `Group QR - ${ticket.passengerCount} Passengers` : 'QR For Driver Verification Only'}<br>
                  </div>
                </div>
                
                <div class="divider"></div>
              ` : ''}
              
              <div class="receipt-footer">
                <div style="margin-bottom: 1mm;">( ຂໍໃຫ້ທ່ານເດີນທາງປອດໄພ )</div>
                ${ticket.ticketType === 'group' ? '<div style="font-size: 10px; color: #666;">ໝາຍເຫດ: ກຸ່ມຄົນເດີນທາງຮ່ວມກັນ</div>' : ''}
              </div>
              
              ${index < ticketsWithQR.length - 1 ? `
                <div class="cut-line">
                  
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
    handlePrintWithTickets,
    
    // ✅ เพิ่ม Group Ticket related functions
    ticketType,
    updateTicketType
  };
}