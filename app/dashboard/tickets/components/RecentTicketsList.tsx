// app/dashboard/tickets/components/RecentTicketsList.tsx - แสดงเต็ม 5 ใบ
import React from 'react';
import { Ticket } from '../types';
import { FiClock, FiArrowRight, FiList } from 'react-icons/fi';

interface RecentTicketsListProps {
  tickets: Ticket[];
  onViewAllClick: () => void;
}

/**
 * คอมโพเนนต์แสดงรายการตั๋วล่าสุด - แสดงเต็ม 5 ใบ
 */
const RecentTicketsList: React.FC<RecentTicketsListProps> = ({ tickets, onViewAllClick }) => {
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

  // ฟังก์ชันแปลง payment method เป็นสี
  const getPaymentMethodStyle = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'qr':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    },
    {
      _id: '4',
      ticketNumber: 'T1746505407724',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'qr'
    },
    {
      _id: '5',
      ticketNumber: 'T1746505407725',
      price: 45000,
      soldAt: new Date(),
      soldBy: 'System',
      paymentMethod: 'cash'
    }
  ];

  // ใช้ข้อมูลจริงหรือข้อมูลตัวอย่าง และให้แสดงครบ 5 ใบ
  const ticketsToShow = tickets.length > 0 ? tickets.slice(0, 5) : placeholderTickets;

  if (ticketsToShow.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiList className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">ຍັງບໍ່ມີປີ້</h3>
        <p className="text-gray-500 mb-4">ປີ້ທີ່ອອກຈະປາກົດຢູ່ນີ້</p>
        
        {/* ปุ่มดูทั้งหมด - แม้ไม่มีข้อมูล */}
        <button 
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center group"
          onClick={onViewAllClick}
        >
          <span>ເບິ່ງປີ້ທັງໝົດ</span>
          <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* แสดงตั๋วทั้ง 5 ใบ */}
      {ticketsToShow.map((ticket, index) => (
        <div 
          key={ticket._id || index} 
          className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{ticket.ticketNumber}</h4>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPaymentMethodStyle(ticket.paymentMethod)}`}>
                  {getPaymentMethodText(ticket.paymentMethod)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <span className="font-semibold text-gray-900">₭{ticket.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <FiClock className="h-3 w-3 mr-1" />
                  <span className="text-xs">
                    {new Date(ticket.soldAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* ปุ่มดูทั้งหมด - ย้ายมาด้านล่าง */}
      <div className="pt-3">
        <button 
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center group"
          onClick={onViewAllClick}
        >
          <span>ເບິ່ງປີ້ທັງໝົດ</span>
          <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
};

export default RecentTicketsList;