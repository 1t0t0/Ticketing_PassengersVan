// app/dashboard/tickets/history/components/TicketTable.tsx - Updated to prevent Staff from deleting tickets
import React from 'react';
import { useSession } from 'next-auth/react';
import { Ticket } from '../../types';
import { FiEdit2 } from 'react-icons/fi';

interface TicketTableProps {
  tickets: Ticket[];
  loading: boolean;
  onDeleteTicket: (ticketId: string, ticketNumber: string) => void;
  onEditPaymentMethod?: (ticketId: string, ticketNumber: string, currentMethod: string) => void;
}

const TicketTable: React.FC<TicketTableProps> = ({ 
  tickets, loading, onDeleteTicket, onEditPaymentMethod 
}) => {
  const { data: session } = useSession();
  
  const getPaymentBadge = (method: string) => {
    const config = {
      cash: { class: "bg-blue-100 text-blue-800", label: "ເງິນສົດ" },
      qr: { class: "bg-green-100 text-green-800", label: "ເງິນໂອນ" }
    };
    const { class: className, label } = config[method as keyof typeof config] || 
      { class: "bg-gray-100 text-gray-800", label: method };
    
    return <span className={`px-2 py-1 text-xs rounded-full ${className}`}>{label}</span>;
  };

  // ตรวจสอบสิทธิ์ในการลบ - เฉพาะ Admin เท่านั้น
  const canDeleteTicket = session?.user?.role === 'admin';

  if (loading) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-500">ກຳລັງໂຫລດ...</p>
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded">
        <p className="text-gray-500">ບໍ່ພົບຂໍ້ມູນ</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="p-3 text-left font-medium text-gray-600">ອອກໂດຍ</th>
            <th className="p-3 text-left font-medium text-gray-600">ເລກປີ້</th>
            <th className="p-3 text-center font-medium text-gray-600">ວິທີຊຳລະ</th>
            <th className="p-3 text-right font-medium text-gray-600">ລາຄາ</th>
            <th className="p-3 text-center font-medium text-gray-600">ເວລາ</th>
            <th className="p-3 text-center font-medium text-gray-600">ຈັດການ</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="border-b hover:bg-gray-50">
              <td className="p-3">{ticket.soldBy}</td>
              <td className="p-3 font-medium">{ticket.ticketNumber}</td>
              <td className="p-3 text-center">{getPaymentBadge(ticket.paymentMethod)}</td>
              <td className="p-3 text-right font-medium">{ticket.price.toLocaleString()}</td>
              <td className="p-3 text-center text-gray-600">
                {new Date(ticket.soldAt).toLocaleTimeString('lo-LA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="p-3 text-center">
                <div className="flex justify-center gap-2">
                  {/* ปุ่มแก้ไขวิธีการชำระเงิน - ทุกคนสามารถใช้ได้ */}
                  <button 
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center gap-1"
                    onClick={() => onEditPaymentMethod?.(ticket._id, ticket.ticketNumber, ticket.paymentMethod)}
                  >
                    <FiEdit2 size={12} />
                    ແກ້ໄຂ
                  </button>
                  
                  {/* ปุ่มลบ - เฉพาะ Admin เท่านั้น */}
                  {canDeleteTicket && (
                    <button 
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                      onClick={() => onDeleteTicket(ticket._id, ticket.ticketNumber)}
                    >
                      ລົບ
                    </button>
                  )}
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