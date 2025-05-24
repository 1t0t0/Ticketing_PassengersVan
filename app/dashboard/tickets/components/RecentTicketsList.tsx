// app/dashboard/tickets/components/RecentTicketsList.tsx (Enhanced Version)
import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { FiRefreshCw, FiClock, FiTrendingUp } from 'react-icons/fi';

interface RecentTicketsListProps {
  tickets: Ticket[];
  onViewAllClick: () => void;
  lastUpdate?: Date;
  onRefresh?: () => void;
  loading?: boolean;
  getLastUpdateText?: () => string;
}

/**
 * คอมโพเนนต์แสดงรายการตั๋วล่าสุดพร้อม Real-time Updates
 */
const RecentTicketsList: React.FC<RecentTicketsListProps> = ({ 
  tickets, 
  onViewAllClick,
  lastUpdate,
  onRefresh,
  loading = false,
  getLastUpdateText
}) => {
  const [animatingTickets, setAnimatingTickets] = useState<Set<string>>(new Set());

  // Animation effect สำหรับตั๋วใหม่
  useEffect(() => {
    if (tickets.length > 0) {
      const latestTicket = tickets[0];
      const ticketAge = new Date().getTime() - new Date(latestTicket.soldAt).getTime();
      
      // ถ้าตั๋วใหม่กว่า 30 วินาที ให้แสดง animation
      if (ticketAge < 30000) {
        setAnimatingTickets(prev => new Set([...prev, latestTicket._id]));
        
        // หยุด animation หลัง 3 วินาที
        setTimeout(() => {
          setAnimatingTickets(prev => {
            const newSet = new Set(prev);
            newSet.delete(latestTicket._id);
            return newSet;
          });
        }, 3000);
      }
    }
  }, [tickets]);

  // ฟังก์ชันแปลง payment method เป็นภาษาลาว
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'ເງິນສົດ';
      case 'qr':
        return 'ເງິນໂອນ';
      default:
        return method;
    }
  };

  // ฟังก์ชันคำนวณเวลาที่ผ่านมา
  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const ticketDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - ticketDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} ວິນາທີທີ່ແລ້ວ`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ນາທີທີ່ແລ້ວ`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ຊົ່ວໂມງທີ່ແລ້ວ`;
    }
  };

  // ถ้าไม่มีตั๋ว ให้แสดงรายการตัวอย่าง
  const placeholderTickets = [
    {
      _id: '1',
      ticketNumber: 'T1746505407721',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'cash'
    },
    {
      _id: '2',
      ticketNumber: 'T1746505407722',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'qr'
    },
    {
      _id: '3',
      ticketNumber: 'T1746505407723',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'cash'
    }
  ];

  // ใช้ข้อมูลจริงหรือข้อมูลตัวอย่าง
  const ticketsToShow = tickets.length > 0 ? tickets : placeholderTickets;

  return (
    <div className="space-y-1">
      {/* Header พร้อมข้อมูลการอัพเดท */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <FiTrendingUp className="text-blue-500" size={16} />
          <span className="text-sm font-medium text-gray-600">ປີ້ລ່າສຸດ</span>
          {tickets.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {tickets.length} ລາຍການ
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getLastUpdateText && (
            <div className="flex items-center text-xs text-gray-500">
              <FiClock size={12} className="mr-1" />
              <span>{getLastUpdateText()}</span>
            </div>
          )}
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
                loading ? 'text-gray-400' : 'text-gray-600 hover:text-blue-500'
              }`}
              title="ລີເຟຣດຂໍ້ມູນ"
            >
              <FiRefreshCw 
                size={14} 
                className={loading ? 'animate-spin' : ''} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            ກຳລັງອັບເດດຂໍ້ມູນ...
          </div>
        </div>
      )}

      {/* Tickets list */}
      <div className="space-y-1">
        {ticketsToShow.map((ticket, index) => {
          const isAnimating = animatingTickets.has(ticket._id || index.toString());
          const isNew = tickets.length > 0 && index === 0 && 
                       new Date().getTime() - new Date(ticket.soldAt).getTime() < 60000; // น้อยกว่า 1 นาที
          
          return (
            <div 
              key={ticket._id || index} 
              className={`py-3 px-2 border-b border-gray-100 last:border-b-0 rounded-md transition-all duration-300 ${
                isAnimating ? 'bg-green-50 border-green-200 shadow-sm' : 
                isNew ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-sm">{ticket.ticketNumber}</p>
                    {isNew && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full animate-pulse">
                        ໃໝ່
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    ₭{ticket.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(ticket.soldAt)}
                  </p>
                </div>
                
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                    ticket.paymentMethod === 'cash' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {getPaymentMethodText(ticket.paymentMethod)}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(ticket.soldAt).toLocaleTimeString('lo-LA', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* View all button */}
      <button 
        className="w-full py-3 px-4 text-sm bg-gray-100 text-gray-700 font-medium rounded-lg mt-4 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
        onClick={onViewAllClick}
      >
        <span>ເບິ່ງປີ້ທັງໝົດ</span>
        <span className="text-xs text-gray-500">→</span>
      </button>
      
      {/* Real-time indicator */}
      <div className="flex justify-center pt-2">
        <div className="flex items-center text-xs text-gray-400 space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>ອັບເດດອັດຕະໂນມັດ</span>
        </div>
      </div>
    </div>
  );
};

export default RecentTicketsList;