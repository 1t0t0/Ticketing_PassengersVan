// app/dashboard/tickets/components/TicketSalesForm.tsx - ปรับ Layout ให้สมส่วน
import React from 'react';
import { FiDollarSign, FiCreditCard, FiPrinter, FiMapPin } from 'react-icons/fi';

interface TicketSalesFormProps {
  ticketPrice: number;
  paymentMethod: 'cash' | 'qr';
  setPaymentMethod: (method: 'cash' | 'qr') => void;
  onSellTicket: () => Promise<void>;
  loading: boolean;
}

/**
 * คอมโพเนนต์แบบฟอร์มขายตั๋ว - Layout ที่สมส่วน
 */
const TicketSalesForm: React.FC<TicketSalesFormProps> = ({
  ticketPrice,
  paymentMethod,
  setPaymentMethod,
  onSellTicket,
  loading
}) => {
  return (
    <div className="space-y-6">
      {/* ส่วนแสดงราคา - ปรับให้เด่นขึ้น */}
      <div className="text-center bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-center mb-2">
          <FiDollarSign className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-600 uppercase font-semibold tracking-wide">ລາຄາປີ້</p>
        </div>
        <p className="text-4xl font-black text-blue-900 mb-1">₭{ticketPrice.toLocaleString()}</p>
        <p className="text-sm text-blue-700">ລາຄາມາດຕະຖານ</p>
      </div>

      {/* ส่วนเลือกประเภทการชำระ - ปรับให้สวยขึ้น */}
      <div>
        <div className="flex items-center mb-3">
          <FiCreditCard className="h-4 w-4 text-gray-600 mr-2" />
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">ປະເພດການຊຳລະ</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`relative py-3 px-4 text-center font-semibold rounded-lg transition-all duration-200 border-2 ${
              paymentMethod === 'cash' 
                ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
            onClick={() => setPaymentMethod('cash')}
          >
            <div className="flex flex-col items-center space-y-1">
              <FiDollarSign className="h-5 w-5" />
              <span className="text-sm">ເງິນສົດ</span>
            </div>
            {paymentMethod === 'cash' && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>
            )}
          </button>
          
          <button
            type="button"
            className={`relative py-3 px-4 text-center font-semibold rounded-lg transition-all duration-200 border-2 ${
              paymentMethod === 'qr' 
                ? 'bg-green-500 text-white border-green-500 shadow-md' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50'
            }`}
            onClick={() => setPaymentMethod('qr')}
          >
            <div className="flex flex-col items-center space-y-1">
              <FiCreditCard className="h-5 w-5" />
              <span className="text-sm">ເງິນໂອນ</span>
            </div>
            {paymentMethod === 'qr' && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* ปุ่มออกตั๋ว - ปรับให้โดดเด่น */}
      <button
        type="button"
        className={`w-full py-4 px-6 text-lg font-bold rounded-lg transition-all duration-200 shadow-lg ${
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
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

      {/* ข้อมูลเพิ่มเติม - เพิ่มเพื่อให้ฟอร์มสมส่วน */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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