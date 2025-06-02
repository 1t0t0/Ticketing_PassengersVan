// TicketConfirmationModal.tsx - Reduced
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
  isOpen, ticketPrice, paymentMethod, quantity, onQuantityChange, onConfirm, onCancel, loading
}) => {
  if (!isOpen) return null;

  const getPaymentText = (method: string) => method === 'cash' ? 'ເງິນສົດ' : 'ເງິນໂອນ';
  const totalAmount = ticketPrice * quantity;

  const changeQuantity = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      onQuantityChange(newQuantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border">
        <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <FiPrinter className="mr-2" />
            <h3 className="text-lg font-bold">ຢືນຢັນອອກປີ້</h3>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-blue-600 rounded" disabled={loading}>
            <FiX />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-1">ລາຄາຕໍ່ໃບ</div>
            <div className="bg-gray-50 rounded-lg p-4 border-2">
              <div className="text-xl font-bold text-gray-800 mb-1">₭{ticketPrice.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mb-3">{quantity} ໃບ x ₭{ticketPrice.toLocaleString()}</div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">ລາຄາລວມທັງໝົດ:</span>
                  <span className="text-3xl font-bold text-blue-600">₭{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-semibold mb-3">ຈຳນວນໃບ</div>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => changeQuantity(-1)}
                disabled={quantity <= 1 || loading}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition ${
                  quantity <= 1 || loading ? 'border-gray-300 text-gray-300 cursor-not-allowed bg-gray-100' 
                  : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'
                }`}
              >
                −
              </button>
              
              <div className="bg-white border-2 rounded-lg px-6 py-2">
                <div className="text-2xl font-bold text-center">{quantity}</div>
              </div>
              
              <button
                onClick={() => changeQuantity(1)}
                disabled={quantity >= 10 || loading}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition ${
                  quantity >= 10 || loading ? 'border-gray-300 text-gray-300 cursor-not-allowed bg-gray-100' 
                  : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'
                }`}
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-semibold mb-2">ວິທີການຊຳລະ</div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${paymentMethod === 'cash' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <span className="font-medium">{getPaymentText(paymentMethod)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 mr-2 font-bold">ໝາຍເຫດ:</div>
              <div className="text-blue-700 text-sm">ກະລຸນາກວດສອບຂໍ້ມູນກ່ອນຢືນຢັນ</div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition border"
              onClick={onCancel}
              disabled={loading}
            >
              ຍົກເລີກ
            </button>
            
            <button
              className={`flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center justify-center ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ກຳລັງດຳເນີນການ...
                </div>
              ) : 'ຢືນຢັນ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketConfirmationModal;