// แก้ไขส่วน style ของตาราง TicketTable.tsx

import React from 'react';
import { Ticket } from '../../types';

interface TicketTableProps {
  tickets: Ticket[];
  loading: boolean;
  onDeleteTicket: (ticketId: string, ticketNumber: string) => void;
}

const TicketTable: React.FC<TicketTableProps> = ({ tickets, loading, onDeleteTicket }) => {
  // ฟังก์ชันแสดงแท็กสีสำหรับวิธีการชำระเงิน
  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-medium">
            ເງິນສົດ
          </span>
        );
      case 'qr':
        return (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 font-medium">
            ເງິນໂອນ
          </span>
        );
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-2.5 bg-gray-300 rounded w-1/2 mx-auto mb-2.5"></div>
          <div className="h-2.5 bg-gray-300 rounded w-1/3 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-500">ກຳລັງໂຫລດ...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">ບໍ່ພົບຂໍ້ມູນ</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-3 text-left w-16">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
            </th>
            <th className="p-3 text-left font-medium text-gray-600">ອອກໂດຍ</th>
            <th className="p-3 text-left font-medium text-gray-600">ເລກບີ້</th>
            <th className="p-3 text-center font-medium text-gray-600">ວິທີການຊຳລະເງິນ</th>
            <th className="p-3 text-right font-medium text-gray-600">ລາຄາ</th>
            <th className="p-3 text-center font-medium text-gray-600">ວັນເວລາ</th>
            <th className="p-3 text-center font-medium text-gray-600">ການຈັດການ</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="p-3">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
              </td>
              <td className="p-3">{ticket.soldBy}</td>
              <td className="p-3 font-medium">{ticket.ticketNumber}</td>
              <td className="p-3 text-center">
                {getPaymentMethodBadge(ticket.paymentMethod)}
              </td>
              <td className="p-3 text-right font-medium">{ticket.price.toLocaleString()}</td>
              <td className="p-3 text-center text-gray-600">
                {new Date(ticket.soldAt).toLocaleTimeString('lo-LA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="p-3 text-center">
                <button 
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors shadow-sm"
                  onClick={() => onDeleteTicket(ticket._id, ticket.ticketNumber)}
                >
                  ລົບ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;