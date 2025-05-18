// app/dashboard/tickets/components/PrintableTickets.tsx (สร้างใหม่)
import React from "react";
import { LuBus } from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa6";
import { Ticket } from '../types';

interface PrintableTicketsProps {
  tickets: Ticket[];
}

export default function PrintableTickets({ tickets }: PrintableTicketsProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

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

  return (
    <div id="printable-content" className="flex flex-col gap-1 print:gap-0">
      {tickets.map((ticket, index) => (
        <div 
          key={ticket._id || index}
          className="w-[99mm] h-[150mm] mx-auto bg-white border-2 border-black flex flex-col page-break-after-always" 
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '12px', 
            pageBreakInside: 'avoid',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            pageBreakAfter: index < tickets.length - 1 ? 'always' : 'auto'
          }}
        >
          {/* Top Section */}
          <div className="bg-black text-white p-4 text-center">
            <h1 className="text-3xl text-black font-extrabold uppercase">ປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</h1>
          </div>
    
          {/* Ticket Details */}
          <div className="p-4 border-b-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-bold">ໝາຍເລກປີ້/Ticket No:</span>
              <span>{ticket.ticketNumber}</span>
              <span className="font-bold">ວັນ-ເວລາ/Date-Time:</span>
              <span>{formatDate(new Date(ticket.soldAt))}</span>
              <span className="font-bold">ລາຄາ/Price:</span>
              <span className="font-bold">{ticket.price.toLocaleString()}</span>
              <span className="font-bold">ຊຳລະ/Payment:</span>
              <span>{getPaymentMethodText(ticket.paymentMethod)}</span>
            </div>
          </div>
    
          {/* Route Information */}
          <div className="p-6 border-b-2 text-center">
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold">ສະຖານີລົດໄຟ<br/>TRAIN STATION</span>
              </div>
  
              <FaArrowRight className="text-2xl" />
  
              <div className="flex flex-col items-center mx-4">
                <span className="text-sm font-bold">ຕົວເມືອງ<br/>DOWNTOWN</span>
              </div>
            </div>
          </div>
    
          {/* Bottom Section */}
          <div className="p-4 text-center flex-grow flex flex-col justify-between">
            <div className="flex justify-center items-center my-4">
              <p className="text-xl">ອອກໂດຍ<br/>Sold By:<br/> {ticket.soldBy}</p>
            </div>
  
            <div className="flex justify-center items-center my-4">
              <LuBus className="text-9xl text-gray-200 opacity-60" />
            </div>
  
            <div className="">
              <p className="text-xs">*** THANK YOU ***</p>
              <p className="text-xs">PLEASE KEEP THIS TICKET</p>
              <p className="text-xs">DURING YOUR JOURNEY</p>
              <p className="text-xs">ກາລຸນາຮັກສາປີ້ນີ້ໄວ້ເພື່ອກວດກາ</p>
              <p className="text-xs">ຂະນະເດີນທາງ</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}