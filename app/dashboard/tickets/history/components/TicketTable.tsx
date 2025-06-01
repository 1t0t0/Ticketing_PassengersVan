// app/dashboard/tickets/history/components/TicketTable.tsx - Optimized
import React from 'react';
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
  const getPaymentMethodBadge = (method: string) => {
    const styles = {
      cash: "bg-blue-100 text-blue-800 border-blue-200",
      qr: "bg-green-100 text-green-800 border-green-200"
    };
    
    const labels = {
      cash: "ເງິນສົດ",
      qr: "ເງິນໂອນ"
    };
    
    return (
      <span className={`inline-block px-2 py-1 text-xs rounded-full border font-medium ${
        styles[method as keyof typeof styles] || 'bg-gray-100 text-gray-800'
      }`}>
        {labels[method as keyof typeof labels] || method}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-md">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto"></div>
          <div className="h-2.5 bg-gray-300 rounded w-1/2 mx-auto"></div>
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

  const ActionButton = ({ 
    onClick, 
    variant, 
    icon, 
    children 
  }: {
    onClick: () => void;
    variant: 'edit' | 'delete';
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const variants = {
      edit: "bg-blue-500 hover:bg-blue-600",
      delete: "bg-red-500 hover:bg-red-600"
    };
    
    return (
      <button 
        className={`px-2.5 py-1.5 text-white rounded text-sm font-medium transition-colors shadow-sm flex items-center ${variants[variant]}`}
        onClick={onClick}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
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
            <tr key={ticket._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="p-3">{ticket.soldBy}</td>
              <td className="p-3 font-medium">{ticket.ticketNumber}</td>
              <td className="p-3 text-center">
                {getPaymentMethodBadge(ticket.paymentMethod)}
              </td>
              <td className="p-3 text-right font-medium">
                {ticket.price.toLocaleString()}
              </td>
              <td className="p-3 text-center text-gray-600">
                {new Date(ticket.soldAt).toLocaleTimeString('lo-LA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="p-3 text-center">
                <div className="flex justify-center space-x-2">
                  <ActionButton
                    variant="edit"
                    icon={<FiEdit2 size={14} />}
                    onClick={() => onEditPaymentMethod && onEditPaymentMethod(ticket._id, ticket.ticketNumber, ticket.paymentMethod)}
                  >
                    ແກ້ໄຂ
                  </ActionButton>

                  <ActionButton
                    variant="delete"
                    onClick={() => onDeleteTicket(ticket._id, ticket.ticketNumber)}
                  >
                    ລົບ
                  </ActionButton>
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