import React from 'react';
import { Ticket } from '../../types';

interface TicketTableProps {
  tickets: Ticket[];
  loading: boolean;
  onDeleteTicket: (ticketId: string, ticketNumber: string) => void;
}

/**
 * คอมโพเนนต์ตารางแสดงรายการตั๋ว
 */
const TicketTable: React.FC<TicketTableProps> = ({ tickets, loading, onDeleteTicket }) => {
  // ฟังก์ชันแสดงแท็กสีสำหรับวิธีการชำระเงิน
  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            ເງິນສົດ
          </span>
        );
      case 'qr':
        return (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">
            ເງິນໂອນ
          </span>
        );
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <p>ກຳລັງໂຫລດ...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center p-4">
        <p>ບໍ່ພົບຂໍ້ມູນ</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="p-2 text-left w-16">
              <input type="checkbox" className="w-5 h-5" />
            </th>
            <th className="p-2 text-left">ອອກໂດຍ</th>
            <th className="p-2 text-left">ເລກບີ້</th>
            <th className="p-2 text-center">ວິທີການຊຳລະເງິນ</th>
            <th className="p-2 text-right">ລາຄາ</th>
            <th className="p-2 text-center">ວັນເວລາ</th>
            <th className="p-2 text-center">ການຈັດການ</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="p-2">
                <input type="checkbox" className="w-5 h-5" />
              </td>
              <td className="p-2">{ticket.soldBy}</td>
              <td className="p-2">{ticket.ticketNumber}</td>
              <td className="p-2 text-center">
                {getPaymentMethodBadge(ticket.paymentMethod)}
              </td>
              <td className="p-2 text-right">{ticket.price.toLocaleString()}</td>
              <td className="p-2 text-center">
                {new Date(ticket.soldAt).toLocaleTimeString('lo-LA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="p-2 text-center">
                <div className="flex justify-center gap-2">
                  <button 
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    onClick={() => onDeleteTicket(ticket._id, ticket.ticketNumber)}
                  >
                    ລົບ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;