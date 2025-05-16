// ปรับปรุงไฟล์ app/dashboard/tickets/history/components/EditPaymentMethodModal.tsx

import React, { useState } from 'react';
import { FiCreditCard, FiCheckCircle, FiX } from 'react-icons/fi';
import { RiMoneyDollarCircleLine, RiQrCodeLine } from 'react-icons/ri';

interface EditPaymentMethodModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketNumber: string;
  currentMethod: string;
  onClose: () => void;
  onSave: (ticketId: string, newMethod: string) => Promise<void>;
}

const EditPaymentMethodModal: React.FC<EditPaymentMethodModalProps> = ({
  isOpen,
  ticketId,
  ticketNumber,
  currentMethod,
  onClose,
  onSave
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>(currentMethod);
  const [loading, setLoading] = useState<boolean>(false);
  
  if (!isOpen) return null;
  
  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(ticketId, paymentMethod);
      onClose();
    } catch (error) {
      console.error('Error updating payment method:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0  bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
        {/* ส่วนหัว */}
        <div className="bg-blue-500 text-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center">
              <FiCreditCard className="mr-2" size={22} />
              ແກ້ໄຂວິທີການຊຳລະເງິນ
            </h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-blue-600 rounded-full transition-colors"
            >
              <FiX size={22} />
            </button>
          </div>
        </div>
        
        {/* ส่วนเนื้อหา */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-1 text-sm">ປີ້ເລກທີ</p>
            <p className="text-lg font-medium">{ticketNumber}</p>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4 font-medium">ເລືອກວິທີການຊຳລະ</p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* ตัวเลือกเงินสด */}
              <div 
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${paymentMethod === 'cash' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'}
                `}
                onClick={() => setPaymentMethod('cash')}
              >
                <div className="flex justify-between items-center mb-2">
                  <RiMoneyDollarCircleLine 
                    size={30} 
                    className={paymentMethod === 'cash' ? 'text-blue-500' : 'text-gray-400'} 
                  />
                  {paymentMethod === 'cash' && <FiCheckCircle className="text-blue-500" />}
                </div>
                <p className={`font-medium ${paymentMethod === 'cash' ? 'text-blue-700' : 'text-gray-700'}`}>
                  ເງິນສົດ
                </p>
                <p className="text-xs text-gray-500 mt-1">ຊຳລະດ້ວຍເງິນສົດ</p>
              </div>
              
              {/* ตัวเลือก QR */}
              <div 
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${paymentMethod === 'qr' 
                    ? 'border-green-500 bg-green-50 shadow-md' 
                    : 'border-gray-200 hover:border-green-200 hover:bg-green-50'}
                `}
                onClick={() => setPaymentMethod('qr')}
              >
                <div className="flex justify-between items-center mb-2">
                  <RiQrCodeLine 
                    size={30} 
                    className={paymentMethod === 'qr' ? 'text-green-500' : 'text-gray-400'} 
                  />
                  {paymentMethod === 'qr' && <FiCheckCircle className="text-green-500" />}
                </div>
                <p className={`font-medium ${paymentMethod === 'qr' ? 'text-green-700' : 'text-gray-700'}`}>
                  ເງິນໂອນ
                </p>
                <p className="text-xs text-gray-500 mt-1">ຊຳລະຜ່ານຊ່ອງທາງອອນລາຍ</p>
              </div>
            </div>
          </div>
          
          {/* ปุ่มกระทำการ */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
              onClick={onClose}
              disabled={loading}
            >
              ຍົກເລີກ
            </button>
            
            <button
              type="button"
              className={`
                px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                ${paymentMethod === currentMethod ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={handleSave}
              disabled={loading || paymentMethod === currentMethod}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ກຳລັງບັນທຶກ...
                </div>
              ) : 'ບັນທຶກ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentMethodModal;