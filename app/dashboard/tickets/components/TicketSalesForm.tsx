// app/dashboard/tickets/components/TicketSalesForm.tsx (ปรับปรุง)
import React from 'react';

interface TicketSalesFormProps {
  ticketPrice: number;
  paymentMethod: 'cash' | 'qr';
  ticketQuantity: number;
  setPaymentMethod: (method: 'cash' | 'qr') => void;
  setTicketQuantity: (quantity: number) => void;
  onSellTicket: () => Promise<void>;
  loading: boolean;
}

/**
 * คอมโพเนนต์แบบฟอร์มขายตั๋ว
 */
const TicketSalesForm: React.FC<TicketSalesFormProps> = ({
  ticketPrice,
  paymentMethod,
  ticketQuantity,
  setPaymentMethod,
  setTicketQuantity,
  onSellTicket,
  loading
}) => {
  // คำนวณราคารวม
  const totalPrice = ticketPrice * ticketQuantity;

  // ฟังก์ชันเพิ่ม/ลดจำนวนตั๋ว (ไม่น้อยกว่า 1)
  const decreaseQuantity = () => {
    if (ticketQuantity > 1) {
      setTicketQuantity(ticketQuantity - 1);
    }
  };

  const increaseQuantity = () => {
    setTicketQuantity(ticketQuantity + 1);
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs text-gray-600 uppercase font-medium mb-1">ລາຄາປີ້</p>
        <p className="text-3xl font-bold text-blue-600">
          {ticketQuantity > 1 
            ? `₭${totalPrice.toLocaleString()}`
            : `₭${ticketPrice.toLocaleString()}`
          }
        </p>
        <p className="text-sm text-gray-500">{ticketQuantity} ປີ້ x ₭{ticketPrice.toLocaleString()}</p>
      </div>

      {/* เพิ่มส่วนเลือกจำนวนตั๋ว */}
      <div className="mb-6">
        <p className="text-xs text-gray-600 uppercase font-medium mb-1">ຈຳນວນປີ້</p>
        <div className="flex items-center">
          <button
            type="button"
            onClick={decreaseQuantity}
            className="w-10 h-10 bg-gray-200 rounded-l flex items-center justify-center text-gray-700 text-xl border border-gray-300"
            disabled={ticketQuantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            className="w-16 h-10 border-t border-b border-gray-300 text-center text-lg font-bold"
            value={ticketQuantity}
            min="1"
            onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button
            type="button"
            onClick={increaseQuantity}
            className="w-10 h-10 bg-gray-200 rounded-r flex items-center justify-center text-gray-700 text-xl border border-gray-300"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-gray-600 uppercase font-medium mb-1">ປະເພດການຊຳລະ</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`py-2 px-4 text-center font-medium rounded ${
              paymentMethod === 'cash' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setPaymentMethod('cash')}
          >
            ເງິນສົດ
          </button>
          <button
            className={`py-2 px-4 text-center font-medium rounded ${
              paymentMethod === 'qr' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setPaymentMethod('qr')}
          >
            ເງິນໂອນ
          </button>
        </div>
      </div>

      <button
        className="w-full py-3 px-4 bg-blue-500 text-xl text-white font-medium rounded"
        onClick={onSellTicket}
        disabled={loading}
      >
        {loading ? 'ກຳລັງດຳເນີນການ...' : 'ກົດອອກປີ້'}
      </button>
    </div>
  );
};

export default TicketSalesForm;