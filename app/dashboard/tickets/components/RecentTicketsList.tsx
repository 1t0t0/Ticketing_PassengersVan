// RecentTicketsList.tsx - Reduced
import React from 'react';
import { Ticket } from '../types';
import { FiClock, FiArrowRight, FiList } from 'react-icons/fi';

interface RecentTicketsListProps {
  tickets: Ticket[];
  onViewAllClick: () => void;
}

const RecentTicketsList: React.FC<RecentTicketsListProps> = ({ tickets, onViewAllClick }) => {
  const getPaymentText = (method: string) => method === 'cash' ? 'ເງິນສົດ' : 'ເງິນໂອນ';
  
  const getPaymentStyle = (method: string) => 
    method === 'cash' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  const placeholderTickets = Array.from({ length: 5 }, (_, i) => ({
    _id: `${i + 1}`,
    ticketNumber: `T174650540772${i + 1}`,
    price: 45000,
    soldAt: new Date(),
    soldBy: 'System',
    paymentMethod: i % 2 === 0 ? 'cash' : 'qr'
  }));

  const ticketsToShow = tickets.length > 0 ? tickets.slice(0, 5) : placeholderTickets;

  if (ticketsToShow.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiList className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">ຍັງບໍ່ມີປີ້</h3>
        <p className="text-gray-500 mb-4">ປີ້ທີ່ອອກຈະປາກົດຢູ່ນີ້</p>
        <button 
          className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition flex items-center justify-center group"
          onClick={onViewAllClick}
        >
          <span>ເບິ່ງປີ້ທັງໝົດ</span>
          <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ticketsToShow.map((ticket, index) => (
        <div key={ticket._id || index} className="bg-white rounded-lg border p-3 hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{ticket.ticketNumber}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStyle(ticket.paymentMethod)}`}>
                  {getPaymentText(ticket.paymentMethod)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">₭{ticket.price.toLocaleString()}</span>
                <div className="flex items-center text-gray-500">
                  <FiClock className="h-3 w-3 mr-1" />
                  <span className="text-xs">
                    {new Date(ticket.soldAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="pt-3">
        <button 
          className="w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition flex items-center justify-center group"
          onClick={onViewAllClick}
        >
          <span>ເບິ່ງປີ້ທັງໝົດ</span>
          <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default RecentTicketsList;