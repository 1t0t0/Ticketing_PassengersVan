// app/dashboard/tickets/history/components/TicketTable.tsx - Enhanced with Group Ticket Display
import React from 'react';
import { useSession } from 'next-auth/react';
import { Ticket } from '../../types';
import { FiEdit2, FiUser, FiUsers } from 'react-icons/fi';

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

  // ✅ เพิ่มฟังก์ชันสำหรับแสดงประเภทตั๋ว
  const getTicketTypeBadge = (ticket: Ticket) => {
    if (ticket.ticketType === 'group') {
      return (
        <div className="flex items-center gap-1">
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <FiUsers className="h-3 w-3" />
            <span>ກຸ່ມ ({ticket.passengerCount})</span>
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
            <FiUser className="h-3 w-3" />
            <span>ປົກກະຕິ</span>
          </span>
        </div>
      );
    }
  };

  // ✅ ฟังก์ชันแสดงราคาแบบละเอียด
  const getPriceDisplay = (ticket: Ticket) => {
    if (ticket.ticketType === 'group') {
      return (
        <div className="text-right">
          <div className="font-bold text-green-600">₭{ticket.price.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            ₭{ticket.pricePerPerson?.toLocaleString() || '45,000'} × {ticket.passengerCount}
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-right">
          <div className="font-bold text-gray-900">₭{ticket.price.toLocaleString()}</div>
        </div>
      );
    }
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
            <th className="p-3 text-center font-medium text-gray-600">ປະເພດ</th>
            <th className="p-3 text-center font-medium text-gray-600">ວິທີຊຳລະ</th>
            <th className="p-3 text-right font-medium text-gray-600">ລາຄາ</th>
            <th className="p-3 text-center font-medium text-gray-600">ເວລາ</th>
            <th className="p-3 text-center font-medium text-gray-600">ຈັດການ</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <div className="truncate max-w-32" title={ticket.soldBy}>
                  {ticket.soldBy}
                </div>
              </td>
              
              <td className="p-3">
                <div className="font-mono font-medium text-blue-600">
                  {ticket.ticketNumber}
                </div>
              </td>
              
              {/* ✅ คอลัมน์ประเภทตั๋วใหม่ */}
              <td className="p-3 text-center">
                {getTicketTypeBadge(ticket)}
              </td>
              
              <td className="p-3 text-center">
                {getPaymentBadge(ticket.paymentMethod)}
              </td>
              
              {/* ✅ คอลัมน์ราคาที่แสดงรายละเอียดสำหรับกลุ่ม */}
              <td className="p-3">
                {getPriceDisplay(ticket)}
              </td>
              
              <td className="p-3 text-center text-gray-600">
                <div className="text-sm">
                  {new Date(ticket.soldAt).toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(ticket.soldAt).toLocaleTimeString('lo-LA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </td>
              
              <td className="p-3 text-center">
                <div className="flex justify-center gap-2">
                  {/* ปุ่มแก้ไขวิธีการชำระเงิน - ทุกคนสามารถใช้ได้ */}
                  <button 
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center gap-1 transition"
                    onClick={() => onEditPaymentMethod?.(ticket._id, ticket.ticketNumber, ticket.paymentMethod)}
                    title="ແກ້ໄຂວິທີການຊຳລະເງິນ"
                  >
                    <FiEdit2 size={12} />
                    ແກ້ໄຂ
                  </button>
                  
                  {/* ปุ่มลบ - เฉพาะ Admin เท่านั้น */}
                  {canDeleteTicket && (
                    <button 
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                      onClick={() => onDeleteTicket(ticket._id, ticket.ticketNumber)}
                      title="ລົບປີ້ (ເຉພາະ Admin)"
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