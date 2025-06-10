// app/dashboard/tickets/components/PrintableTicket.tsx - Updated with short ticket numbers
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

  const getPaymentText = (method: string) => method === 'cash' ? 'ເງິນສົດ/CASH' : 'ເງິນໂອນ/QR';

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
      
      // ✅ ใช้แค่หมายเลขตั๋ว (ไม่ใช่ JSON)
      const qrData = ticketNumber;
      
      const dataURL = await QRCode.toDataURL(qrData, {
        width: 150,                    // ✅ ขนาดใหญ่ขึ้น
        margin: 3,                     // ✅ ขอบกว้างขึ้น
        errorCorrectionLevel: 'H',     // ✅ แก้ไข error ได้ดีที่สุด
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataURL(dataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeDataURL(null);
    }
  };

  generateQRCode();
}, [ticketNumber]);

  return (
    <div 
      id="printable-content"
      className="w-[99mm] h-[200mm] mx-auto bg-white border-2 border-black flex flex-col" 
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', pageBreakInside: 'avoid' }}
    >
      {/* Header */}
      <div className="bg-black text-white p-4 text-center">
        <h1 className="text-2xl text-white font-extrabold uppercase leading-tight">
          ປີ້ລົດຕູ້ໂດຍສານປະຈຳທາງ<br/>
          ລົດໄຟ ລາວ-ຈີນ
        </h1>
        <div className="text-sm mt-1">BUS TICKET LAOS-CHINA RAILWAY</div>
      </div>

      {/* Ticket Details - Updated with larger ticket number display */}
      <div className="p-4 border-b-2">
        {/* Ticket Number - Make it prominent */}
        <div className="text-center mb-4 p-3 bg-blue-50 rounded border">
          <div className="text-xs text-gray-600 mb-1">ໝາຍເລກປີ້ / Ticket No:</div>
          <div className="text-3xl font-bold text-blue-600 tracking-wider">
            {ticketNumber}
          </div>
        </div>
        
        {/* Other details in smaller grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="font-medium text-gray-700">ວັນ-ເວລາ/Date-Time:</span>
          <span className="text-gray-900">{formatDate(soldAt)}</span>
          
          <span className="font-medium text-gray-700">ລາຄາ/Price:</span>
          <span className="font-bold text-green-600">₭{price.toLocaleString()}</span>
          
          <span className="font-medium text-gray-700">ຊຳລະ/Payment:</span>
          <span className="text-gray-900">{getPaymentText(paymentMethod)}</span>
          
          <span className="font-medium text-gray-700">ອອກໂດຍ/Sold By:</span>
          <span className="text-gray-900 text-xs">{soldBy}</span>
        </div>
      </div>

      {/* Route Information */}
      <div className="p-6 border-b-2 text-center">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-blue-700">ສະຖານີລົດໄຟ<br/>TRAIN STATION</span>
          </div>
          <FaArrowRight className="text-2xl text-blue-600" />
          <div className="flex flex-col items-center mx-4">
            <span className="text-sm font-bold text-blue-700">ຕົວເມືອງ<br/>DOWNTOWN</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          ໄລຍະເວລາປະມານ 45 ນາທີ / Approx. 45 minutes
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
      <p className="text-sm font-bold text-gray-700">🔍 QR CODE FOR DRIVER</p>
    </div>
    <div className="flex justify-center mb-2">
      <img 
        src={qrCodeDataURL} 
        alt="QR Code for Driver Verification" 
        className="w-20 h-20 border border-gray-300 bg-white p-1"
      />
    </div>
    <div className="text-center">
      <p className="text-xs font-bold text-red-600">ສຳລັບພະນັກງານຂັບລົດເທົ່ານັ້ນ</p>
      <p className="text-xs text-gray-600">For Driver Verification Only</p>
      <p className="text-xs text-gray-500">
        {/* ✅ อัพเดทข้อความให้ตรงกับการทำงานใหม่ */}
        Ticket: <span className="font-mono font-bold">{ticketNumber}</span>
      </p>
    </div>
  </div>
)}

      {/* Footer */}
      <div className="p-4 text-center flex-grow flex flex-col justify-end">
        <div className="space-y-1">
          <p className="text-xs font-bold">*** ຂໍໃຫ້ເດີນທາງປອດໄພ ***</p>
          <p className="text-xs">*** THANK YOU - SAFE JOURNEY ***</p>
          <p className="text-xs">PLEASE KEEP THIS TICKET DURING YOUR JOURNEY</p>
          <p className="text-xs text-gray-600">ກາລຸນາຮັກສາປີ້ນີ້ໄວ້ເພື່ອກວດກາຂະນະເດີນທາງ</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Ticket ID: <span className="font-mono">{ticketNumber}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}