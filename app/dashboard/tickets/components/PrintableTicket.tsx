// app/dashboard/tickets/components/PrintableTicket.tsx - Enhanced with QR Code
import React, { useEffect, useState } from 'react';
import { LuBus } from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa6";

interface TicketTemplateProps {
  ticketNumber: string;
  price: number;
  soldAt: Date;
  soldBy: string;
  paymentMethod: string;
}

export default function TicketTemplate({
  ticketNumber, price, soldAt, soldBy, paymentMethod
}: TicketTemplateProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getPaymentText = (method: string) => method === 'cash' ? 'ເງິນສົດ' : 'ເງິນໂອນ';

  // สร้าง QR Code data สำหรับ Driver
  const generateQRCodeData = () => {
    const qrData = {
      ticketNumber,
      price,
      soldAt: soldAt.toISOString(),
      paymentMethod,
      soldBy,
      route: "ສະຖານີລົດໄຟ-ຕົວເມືອງ",
      forDriverOnly: true,
      validationKey: `DRV-${ticketNumber}-${soldAt.getTime()}`
    };
    return JSON.stringify(qrData);
  };

  // สร้าง QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const QRCode = await import('qrcode');
        const qrData = generateQRCodeData();
        const dataURL = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setQrCodeDataURL(dataURL);
      } catch (error) {
        console.error('Error generating QR code:', error);
        setQrCodeDataURL(null);
      }
    };

    generateQRCode();
  }, [ticketNumber, price, soldAt, paymentMethod, soldBy]);

  return (
    <div 
      id="printable-content"
      className="w-[99mm] h-[200mm] mx-auto bg-white border-2 border-black flex flex-col" 
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', pageBreakInside: 'avoid' }}
    >
      {/* Header */}
      <div className="bg-black text-white p-4 text-center">
        <h1 className="text-3xl text-white font-extrabold uppercase">ປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງລົດໄຟ ລາວ-ຈີນ</h1>
      </div>

      {/* Ticket Details */}
      <div className="p-4 border-b-2">
        <div className="grid grid-cols-2 gap-2">
          <span className="font-bold">ໝາຍເລກປີ້/Ticket No:</span>
          <span>{ticketNumber}</span>
          <span className="font-bold">ວັນ-ເວລາ/Date-Time:</span>
          <span>{formatDate(soldAt)}</span>
          <span className="font-bold">ລາຄາ/Price:</span>
          <span className="font-bold">{price.toLocaleString()}</span>
          <span className="font-bold">ຊຳລະ/Payment:</span>
          <span>{getPaymentText(paymentMethod)}</span>
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

      {/* Sold By Information */}
      <div className="p-4 text-center border-b-2">
        <div className="flex justify-center items-center my-4">
          <p className="text-xl">ອອກໂດຍ<br/>Sold By:<br/> {soldBy}</p>
        </div>
      </div>

      {/* Bus Icon */}
      <div className="p-4 text-center border-b-2">
        <div className="flex justify-center items-center my-4">
          <LuBus className="text-6xl text-gray-300 opacity-60" />
        </div>
      </div>

      {/* QR Code Section - สำหรับ Driver เท่านั้น */}
      {qrCodeDataURL && (
        <div className="p-4 text-center border-b-2 bg-gray-50">
          <div className="mb-2">
            <p className="text-sm font-bold text-gray-700">🔍 QR CODE</p>
          </div>
          <div className="flex justify-center mb-2">
            <img 
              src={qrCodeDataURL} 
              alt="QR Code for Driver Verification" 
              className="w-16 h-16 border border-gray-300 bg-white p-1"
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-red-600">ສຳລັບຄົນຂັບລົດເທົ່ານັ້ນ</p>
            <p className="text-xs text-gray-600">For Driver Verification Only</p>
            <p className="text-xs text-gray-500">ໃຊ້ເພື່ອກວດສອບຄວາມຖືກຕ້ອງ</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 text-center flex-grow flex flex-col justify-end">
        <div>
          <p className="text-xs">*** THANK YOU ***</p>
          <p className="text-xs">PLEASE KEEP THIS TICKET</p>
          <p className="text-xs">DURING YOUR JOURNEY</p>
          <p className="text-xs">ກາລຸນາຮັກສາປີ້ນີ້ໄວ້ເພື່ອກວດກາ</p>
          <p className="text-xs">ຂະນະເດີນທາງ</p>
        </div>
      </div>
    </div>
  );
}