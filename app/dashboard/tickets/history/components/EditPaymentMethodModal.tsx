// EditPaymentMethodModal.tsx - Reduced
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
  isOpen, ticketId, ticketNumber, currentMethod, onClose, onSave
}) => {
  const [paymentMethod, setPaymentMethod] = useState(currentMethod);
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(ticketId, paymentMethod);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const options = [
    { value: 'cash', icon: <RiMoneyDollarCircleLine size={24} />, label: 'ເງິນສົດ' },
    { value: 'qr', icon: <RiQrCodeLine size={24} />, label: 'ເງິນໂອນ' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <FiCreditCard />
            ແກ້ໄຂວິທີການຊຳລະເງິນ
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-blue-600 rounded">
            <FiX />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">ປີ້ເລກທີ</p>
            <p className="font-medium">{ticketNumber}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">ເລືອກວິທີການຊຳລະ</p>
            <div className="grid grid-cols-2 gap-2">
              {options.map(({ value, icon, label }) => (
                <div
                  key={value}
                  className={`border-2 rounded p-3 cursor-pointer transition ${
                    paymentMethod === value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                  onClick={() => setPaymentMethod(value)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className={paymentMethod === value ? 'text-blue-500' : 'text-gray-400'}>
                      {icon}
                    </div>
                    {paymentMethod === value && <FiCheckCircle className="text-blue-500" />}
                  </div>
                  <p className="text-sm font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
              onClick={onClose}
              disabled={loading}
            >
              ຍົກເລີກ
            </button>
            
            <button
              className={`flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium ${
                loading || paymentMethod === currentMethod ? 'opacity-50' : ''
              }`}
              onClick={handleSave}
              disabled={loading || paymentMethod === currentMethod}
            >
              {loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPaymentMethodModal;
