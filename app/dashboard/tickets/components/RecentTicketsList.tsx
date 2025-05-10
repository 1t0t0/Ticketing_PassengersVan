import React from 'react';
import { Ticket } from '../types';

interface RecentTicketsListProps {
  tickets: Ticket[];
  onViewAllClick: () => void;
}

/**
 * คอมโพเนนต์แสดงรายการตั๋วล่าสุด
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
      {ticketsToShow.map((ticket, index) => (
        <div key={ticket._id || index} className="py-2 border-b border-gray-100 last:border-b-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{ticket.ticketNumber}</p>
              <p className="text-sm text-gray-600">₭{ticket.price.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                ticket.paymentMethod === 'cash' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {getPaymentMethodText(ticket.paymentMethod)}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(ticket.soldAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      <button 
        className="w-full py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded mt-4 cursor-pointer"
        onClick={onViewAllClick}
      >
        VIEW ALL TICKETS
      </button>
    </div>
  );
};

export default RecentTicketsList;