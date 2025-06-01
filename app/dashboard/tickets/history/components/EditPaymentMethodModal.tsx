// app/dashboard/tickets/history/components/EditPaymentMethodModal.tsx - Optimized
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
  
  const PaymentOption = ({ value, icon, label, description, colorClass }: {
    value: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    colorClass: string;
  }) => (
    <div 
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        paymentMethod === value 
          ? `border-${colorClass}-500 bg-${colorClass}-50 shadow-md` 
          : `border-gray-200 hover:border-${colorClass}-200 hover:bg-${colorClass}-50`
      }`}
      onClick={() => setPaymentMethod(value)}
    >
      <div className="flex justify-between items-center mb-2">
        <div className={paymentMethod === value ? `text-${colorClass}-500` : 'text-gray-400'}>
          {icon}
        </div>
        {paymentMethod === value && <FiCheckCircle className={`text-${colorClass}-500`} />}
      </div>
      <p className={`font-medium ${paymentMethod === value ? `text-${colorClass}-700` : 'text-gray-700'}`}>
        {label}
      </p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-blue-500 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center">
              <FiCreditCard className="mr-2" />
              ແກ້ໄຂວິທີການຊຳລະເງິນ
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-blue-600 rounded-full">
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-1 text-sm">ປີ້ເລກທີ</p>
            <p className="text-lg font-medium">{ticketNumber}</p>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-3 font-medium">ເລືອກວິທີການຊຳລະ</p>
            
            <div className="grid grid-cols-2 gap-3">
              <PaymentOption
                value="cash"
                icon={<RiMoneyDollarCircleLine size={28} />}
                label="ເງິນສົດ"
                description="ຊຳລະດ້ວຍເງິນສົດ"
                colorClass="blue"
              />
              
              <PaymentOption
                value="qr"
                icon={<RiQrCodeLine size={28} />}
                label="ເງິນໂອນ"
                description="ຊຳລະຜ່ານອອນລາຍ"
                colorClass="green"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              onClick={onClose}
              disabled={loading}
            >
              ຍົກເລີກ
            </button>
            
            <button
              className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium ${
                loading || paymentMethod === currentMethod ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleSave}
              disabled={loading || paymentMethod === currentMethod}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
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