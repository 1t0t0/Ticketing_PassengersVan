// TicketSalesForm.tsx - Reduced
import React from 'react';
import { FiDollarSign, FiCreditCard, FiPrinter, FiMapPin } from 'react-icons/fi';

interface TicketSalesFormProps {
  ticketPrice: number;
  paymentMethod: 'cash' | 'qr';
  setPaymentMethod: (method: 'cash' | 'qr') => void;
  onSellTicket: () => Promise<void>;
  loading: boolean;
}

const TicketSalesForm: React.FC<TicketSalesFormProps> = ({
  ticketPrice, paymentMethod, setPaymentMethod, onSellTicket, loading
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-center mb-2">
          <FiDollarSign className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-600 uppercase font-semibold tracking-wide">ລາຄາປີ້</p>
        </div>
        <p className="text-4xl font-black text-blue-900 mb-1">₭{ticketPrice.toLocaleString()}</p>
        <p className="text-sm text-blue-700">ລາຄາມາດຕະຖານ</p>
      </div>

      <div>
        <div className="flex items-center mb-3">
          <FiCreditCard className="h-4 w-4 text-gray-600 mr-2" />
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">ປະເພດການຊຳລະ</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'cash', icon: FiDollarSign, label: 'ເງິນສົດ', color: 'blue' },
            { value: 'qr', icon: FiCreditCard, label: 'ເງິນໂອນ', color: 'green' }
          ].map(({ value, icon: Icon, label, color }) => (
            <button
              key={value}
              className={`relative py-3 px-4 text-center font-semibold rounded-lg transition border-2 ${
                paymentMethod === value 
                  ? `bg-${color}-500 text-white border-${color}-500 shadow-md` 
                  : `bg-white text-gray-700 border-gray-200 hover:border-${color}-300 hover:bg-${color}-50`
              }`}
              onClick={() => setPaymentMethod(value as 'cash' | 'qr')}
            >
              <div className="flex flex-col items-center space-y-1">
                <Icon className="h-5 w-5" />
                <span className="text-sm">{label}</span>
              </div>
              {paymentMethod === value && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        className={`w-full py-4 px-6 text-lg font-bold rounded-lg transition shadow-lg ${
          loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:scale-[1.02]'
        }`}
        onClick={onSellTicket}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            ກຳລັງດຳເນີນການ...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <FiPrinter className="mr-2 h-5 w-5" />
            ກົດອອກປີ້
          </div>
        )}
      </button>

      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <FiMapPin className="h-4 w-4 text-gray-600 mr-2" />
            <h4 className="font-semibold text-gray-800">ເສັ້ນທາງ</h4>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">ສະຖານີລົດໄຟ</span>
            <span>→</span>
            <span className="font-medium">ຕົວເມືອງ</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">ໄລຍະເວລາ ~45 ນາທີ</p>
        </div>
      </div>
    </div>
  );
};

export default TicketSalesForm;