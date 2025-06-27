// app/dashboard/tickets/components/PrintableTicket.tsx - Updated with Destination Support
import React, { useEffect, useState } from 'react';
import { LuBus } from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa6";

interface TicketTemplateProps {
  ticketNumber: string;
  price: number;
  soldAt: Date;
  soldBy: string;
  paymentMethod: string;
  
  // ✅ เพิ่ม Props สำหรับ Group Ticket และ Destination
  ticketType?: 'individual' | 'group';
  passengerCount?: number;
  pricePerPerson?: number;
  destination?: string;
}

export default function TicketTemplate({
  ticketNumber, price, soldAt, soldBy, paymentMethod,
  ticketType = 'individual', passengerCount = 1, pricePerPerson, destination
}: TicketTemplateProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getPaymentText = (method: string) => method === 'cash' ? 'ເງິນສົດ/CASH' : 'ເງິນໂອນ/QR';

  // ✅ ฟังก์ชันกำหนดปลายทาง
  const getDestinationText = () => {
    return destination && destination.trim() ? destination.trim() : 'ຕົວເມືອງ';
  };

  // สร้าง QR Code data สำหรับ Driver
  const generateQRCodeData = () => {
    if (ticketType === 'group') {
      // สำหรับ Group Ticket ใส่ข้อมูลเพิ่มเติม
      const qrData = {
        ticketNumber,
        ticketType: 'group',
        passengerCount,
        totalPrice: price,
        pricePerPerson,
        destination: getDestinationText(),
        soldAt: soldAt.toISOString(),
        paymentMethod,
        soldBy,
        forDriverOnly: true,
        validationKey: `GRP-${ticketNumber}-${soldAt.getTime()}`
      };
      return JSON.stringify(qrData);
    } else {
      // สำหรับ Individual Ticket ใช้แค่หมายเลขตั๋ว
      return ticketNumber;
    }
  };

  // สร้าง QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const QRCode = await import('qrcode');
        
        const qrData = generateQRCodeData();
        
        const dataURL = await QRCode.toDataURL(qrData, {
          width: 150,
          margin: 3,
          errorCorrectionLevel: 'H',
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
  }, [ticketNumber, ticketType, passengerCount, destination]);

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

      {/* Ticket Details - Enhanced with Group Ticket support */}
      <div className="p-4 border-b-2">
        {/* Ticket Number - Make it prominent */}
        <div className="text-center mb-4 p-3 bg-blue-50 rounded border">
          <div className="text-xs text-gray-600 mb-1">ໝາຍເລກປີ້ / Ticket No:</div>
          <div className="text-3xl font-bold text-blue-600 tracking-wider">
            {ticketNumber}
          </div>
          
          {/* ✅ แสดงข้อมูล Group Ticket */}
          {ticketType === 'group' && (
            <div className="mt-2 text-sm">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                🎫 ປີ້ກຸ່ມ: {passengerCount} ຄົນ
              </span>
            </div>
          )}
        </div>
        
        {/* Other details in grid format */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="font-medium text-gray-700">ວັນ-ເວລາ/Date-Time:</span>
          <span className="text-gray-900">{formatDate(soldAt)}</span>
          
          {/* ✅ แสดงราคาแบบละเอียดสำหรับ Group Ticket */}
          {ticketType === 'group' ? (
            <>
              <span className="font-medium text-gray-700">ລາຄາຕໍ່ຄົນ/Per Person:</span>
              <span className="text-gray-900">₭{pricePerPerson?.toLocaleString()}</span>
              
              <span className="font-medium text-gray-700">ລາຄາລວມ/Total:</span>
              <span className="font-bold text-green-600">₭{price.toLocaleString()}</span>
              
              <span className="font-medium text-gray-700">ຈຳນວນຄົນ/Passengers:</span>
              <span className="font-bold text-blue-600">{passengerCount} ຄົນ</span>
            </>
          ) : (
            <>
              <span className="font-medium text-gray-700">ລາຄາ/Price:</span>
              <span className="font-bold text-green-600">₭{price.toLocaleString()}</span>
            </>
          )}
          
          <span className="font-medium text-gray-700">ຊຳລະ/Payment:</span>
          <span className="text-gray-900">{getPaymentText(paymentMethod)}</span>
          
          <span className="font-medium text-gray-700">ອອກໂດຍ/Sold By:</span>
          <span className="text-gray-900 text-xs">{soldBy}</span>
        </div>
      </div>

      {/* ✅ Route Information - Enhanced with dynamic destination */}
      <div className="p-6 border-b-2 text-center">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-blue-700">ສະຖານີລົດໄຟ<br/>TRAIN STATION</span>
          </div>
          <FaArrowRight className="text-2xl text-blue-600" />
          <div className="flex flex-col items-center mx-4">
            <span className="text-sm font-bold text-blue-700">
              {getDestinationText()}<br/>
              {getDestinationText().toUpperCase()}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          ໄລຍະເວລາປະມານ 45 ນາທີ / Approx. 45 minutes
        </div>
        
        {/* ✅ แสดงข้อมูลเพิ่มเติมสำหรับ Group Ticket */}
        {ticketType === 'group' && (
          <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
            <div className="text-xs text-green-700">
              <strong>🎫 ປີ້ກຸ່ມ:</strong> ໃຊ້ສຳລັບ {passengerCount} ຄົນ
            </div>
            <div className="text-xs text-green-600 mt-1">
              Group Ticket for {passengerCount} passengers
            </div>
          </div>
        )}
      </div>

      {/* Bus Icon */}
      <div className="p-4 text-center border-b-2">
        <div className="flex justify-center items-center my-4">
          <LuBus className="text-6xl text-gray-300 opacity-60" />
        </div>
      </div>

      {/* QR Code Section - Enhanced for Group Tickets */}
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
              Ticket: <span className="font-mono font-bold">{ticketNumber}</span>
              {ticketType === 'group' && (
                <span className="ml-2 text-green-600 font-bold">
                  ({passengerCount} passengers)
                </span>
              )}
            </p>
            
            {/* ✅ แสดงปลายทางใน QR section */}
            <p className="text-xs text-gray-500 mt-1">
              Destination: <span className="font-bold">{getDestinationText()}</span>
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
            {/* ✅ แสดงข้อมูลปลายทางใน footer */}
            <p className="text-xs text-gray-500">
              Route: ສະຖານີລົດໄຟ → {getDestinationText()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}