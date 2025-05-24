// app/dashboard/tickets/components/TicketConfirmationModal.tsx (Updated)
import React from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';

interface TicketConfirmationModalProps {
  isOpen: boolean;
  ticketPrice: number;
  paymentMethod: 'cash' | 'qr';
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const TicketConfirmationModal: React.FC<TicketConfirmationModalProps> = ({
  isOpen,
  ticketPrice,
  paymentMethod,
  quantity,
  onQuantityChange,
  onConfirm,
  onCancel,
  loading
}) => {
  if (!isOpen) return null;

  const getPaymentMethodText = (method: string) => {
    return method === 'cash' ? 'ເງິນສົດ' : 'ເງິນໂອນ';
  };

  const totalAmount = ticketPrice * quantity;

  // ฟังก์ชันเพิ่ม/ลดจำนวน
  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      onQuantityChange(newQuantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 border border-gray-200">
        {/* ส่วนหัว */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FiPrinter className="mr-2" size={20} />
            <h3 className="text-lg font-bold">ຢືນຢັນອອກປີ້</h3>
          </div>
          <button 
            onClick={onCancel}
            className="p-1 hover:bg-blue-600 rounded-full transition-colors"
            disabled={loading}
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* ส่วนเนื้อหา */}
        <div className="p-6">
          {/* ราคาต่อใบและราคารวม */}
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-1">ລາຄາຕໍ່ໃບ</div>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="text-xl font-bold text-gray-800 mb-1">₭{ticketPrice.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mb-3">
                {quantity} ໃບ x ₭{ticketPrice.toLocaleString()}
              </div>
              
              {/* แสดงราคารวมที่เด่นชัด */}
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">ລາຄາລວມທັງໝົດ:</span>
                  <span className="text-3xl font-bold text-blue-600">₭{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* จำนวนใบ */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-700 mb-3">ຈຳນວນໃບ</div>
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || loading}
                className={`
                  w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all
                  ${quantity <= 1 || loading
                    ? 'border-gray-300 text-gray-300 cursor-not-allowed bg-gray-100' 
                    : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 bg-white'}
                `}
              >
                −
              </button>
              
              <div className="bg-white border-2 border-gray-300 rounded-lg px-6 py-2">
                <div className="text-2xl font-bold text-center">{quantity}</div>
              </div>
              
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 10 || loading}
                className={`
                  w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all
                  ${quantity >= 10 || loading
                    ? 'border-gray-300 text-gray-300 cursor-not-allowed bg-gray-100' 
                    : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 bg-white'}
                `}
              >
                +
              </button>
            </div>
          </div>

          {/* ข้อมูลการชำระเงิน */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-700 mb-2">ວິທີການຊຳລະ</div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  paymentMethod === 'cash' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <span className="font-medium text-gray-700">
                  {getPaymentMethodText(paymentMethod)}
                </span>
              </div>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 mr-2 font-bold">ໝາຍເຫດ:</div>
              <div className="text-blue-700 text-sm">
                ກະລຸນາກວດສອບຂໍ້ມູນກ່ອນຢືນຢັນ. ຂໍ້ມູນນີ້ຈະຖືກບັນທຶກລົງໃນລະບົບ.
              </div>
            </div>
          </div>
          
          {/* ปุ่มกระทำการ */}
          <div className="flex space-x-3">
            <button
              type="button"
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
              onClick={onCancel}
              disabled={loading}
            >
              ຍົກເລີກ
            </button>
            
            <button
              type="button"
              className={`
                flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center shadow-md
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ກຳລັງດຳເນີນການ...
                </div>
              ) : (
                'ຢືນຢັນ'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketConfirmationModal;