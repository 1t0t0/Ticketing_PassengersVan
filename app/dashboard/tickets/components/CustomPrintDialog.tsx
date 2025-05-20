// app/dashboard/tickets/components/CustomPrintDialog.tsx
import React, { useState } from 'react';
import { FiPrinter, FiX, FiMinus, FiPlus } from 'react-icons/fi';

interface CustomPrintDialogProps {
  isOpen: boolean;
  ticketPrice: number;
  ticketQuantity: number;
  paymentMethod: 'cash' | 'qr';
  onCancel: () => void;
  onConfirm: (copies: number) => Promise<void>;
}

const CustomPrintDialog: React.FC<CustomPrintDialogProps> = ({
  isOpen,
  ticketPrice,
  ticketQuantity,
  paymentMethod,
  onCancel,
  onConfirm
}) => {
  const [copies, setCopies] = useState(ticketQuantity);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ถ้า dialog ไม่เปิด ไม่ต้องแสดงอะไร
  if (!isOpen) return null;
  
  // คำนวณราคารวม
  const totalPrice = ticketPrice * copies;
  
  // ฟังก์ชันเพิ่ม/ลดจำนวนสำเนา
  const decreaseCopies = () => {
    if (copies > 1) {
      setCopies(copies - 1);
    }
  };
  
  const increaseCopies = () => {
    setCopies(copies + 1);
  };
  
  // ฟังก์ชันยืนยันการพิมพ์
  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm(copies);
    } catch (error) {
      console.error('Error processing print:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        {/* ส่วนหัว */}
        <div className="bg-blue-500 text-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center">
              <FiPrinter className="mr-2" size={22} />
              ພິມປີ້ລົດຕູ້
            </h3>
            <button 
              onClick={onCancel}
              className="p-1 hover:bg-blue-600 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <FiX size={22} />
            </button>
          </div>
        </div>
        
        {/* ส่วนเนื้อหา */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-xs text-gray-600 uppercase font-medium mb-1">ລາຍລະອຽດປີ້</p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-blue-600 mb-1">
                ₭{totalPrice.toLocaleString()}
              </p>
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>{copies} ປີ້ x ₭{ticketPrice.toLocaleString()}</span>
                <span>
                  {paymentMethod === 'cash' ? 'ຊຳລະດ້ວຍເງິນສົດ' : 'ຊຳລະດ້ວຍ QR'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-xs text-gray-600 uppercase font-medium mb-2">ຈຳນວນສຳເນົາປີ້</p>
            <div className="flex items-center">
              <button
                type="button"
                onClick={decreaseCopies}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-l-lg flex items-center justify-center text-gray-700 text-xl border border-gray-300 transition-colors"
                disabled={copies <= 1 || isProcessing}
              >
                <FiMinus />
              </button>
              <input
                type="number"
                className="w-20 h-12 border-y border-gray-300 text-center text-xl font-bold"
                value={copies}
                min="1"
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={increaseCopies}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-r-lg flex items-center justify-center text-gray-700 text-xl border border-gray-300 transition-colors"
                disabled={isProcessing}
              >
                <FiPlus />
              </button>
            </div>
          </div>
          
          {/* ข้อมูลคำแนะนำ */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 text-sm text-blue-700">
            <p>
              <span className="font-bold">ໝາຍເຫດ:</span> ກະລຸນາກວດສອບຈຳນວນປີ້ກ່ອນການພິມ. ຈຳນວນປີ້ຈະຖືກບັນທຶກລົງໃນລະບົບ.
            </p>
          </div>
          
          {/* ปุ่มกระทำการ */}
          <div className="flex justify-between space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-lg text-gray-700 font-medium rounded-lg transition-colors"
            >
              ຍົກເລີກ
            </button>
            
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-lg text-white font-medium rounded-lg transition-colors shadow-md"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ກຳລັງພິມ...
                </span>
              ) : 'ພິມປີ້'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPrintDialog;