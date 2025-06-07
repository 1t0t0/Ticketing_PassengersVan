// app/dashboard/tickets/components/TicketConfirmationModal.tsx - Enhanced with keyboard input
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiPrinter, FiAlertCircle } from 'react-icons/fi';

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
  const [inputValue, setInputValue] = useState(quantity.toString());
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // ขีดจำกัดสูงสุด - กำหนดให้พิมพ์ได้ไม่เกิน 50 ใบต่อครั้ง
  const MAX_QUANTITY = 50;
  const MIN_QUANTITY = 1;

  // Sync กับ quantity prop
  useEffect(() => {
    if (isOpen) {
      setInputValue(quantity.toString());
      setError('');
      // Focus input เมื่อเปิด modal
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, quantity]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter เพื่อยืนยัน
      if (e.key === 'Enter' && !loading && !error && inputValue) {
        e.preventDefault();
        onConfirm();
      }
      // Escape เพื่อยกเลิก
      else if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, error, inputValue, onConfirm, onCancel]);

  if (!isOpen) return null;

  const getPaymentText = (method: string) => method === 'cash' ? 'ເງິນສົດ' : 'ເງິນໂອນ';
  
  // Validate และ update quantity
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // ลบ error เมื่อเริ่มพิมพ์ใหม่
    if (error) setError('');
    
    // ตรวจสอบว่าเป็นตัวเลขเท่านั้น
    if (value === '') {
      return;
    }
    
    // ตรวจสอบรูปแบบตัวเลข
    const numericValue = parseInt(value, 10);
    
    if (isNaN(numericValue)) {
      setError('ກະລຸນາໃສ່ຕົວເລກເທົ່ານັ້ນ');
      return;
    }
    
    if (numericValue < MIN_QUANTITY) {
      setError(`ຈຳນວນຕໍ່າສຸດ ${MIN_QUANTITY} ໃບ`);
      return;
    }
    
    if (numericValue > MAX_QUANTITY) {
      setError(`ຈຳນວນສູງສຸດ ${MAX_QUANTITY} ໃບຕໍ່ການພິມພ໌ 1 ຄັ້ງ`);
      return;
    }
    
    // ถ้าผ่านการตรวจสอบทั้งหมด
    setError('');
    onQuantityChange(numericValue);
  };

  const totalAmount = ticketPrice * quantity;
  const hasValidQuantity = !error && inputValue && quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;

  // ปุ่ม +/- สำหรับปรับจำนวน
  const changeQuantity = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= MIN_QUANTITY && newQuantity <= MAX_QUANTITY) {
      const newValue = newQuantity.toString();
      setInputValue(newValue);
      handleInputChange(newValue);
    }
  };

  // Handle input focus/blur
  const handleInputFocus = () => {
    inputRef.current?.select();
  };

  const handleInputBlur = () => {
    // ถ้าช่องว่าง ให้กลับไปเป็น 1
    if (!inputValue || inputValue === '0') {
      setInputValue('1');
      handleInputChange('1');
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
          <button 
            onClick={onCancel} 
            className="p-1 hover:bg-blue-600 rounded transition-colors" 
            disabled={loading}
            title="ປິດ (ESC)"
          >
            <FiX />
          </button>
        </div>
        
        <div className="p-6">
          {/* ส่วนแสดงราคา */}
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

          {/* ส่วนจำนวนใบ - Enhanced */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">ຈຳນວນໃບ</label>
              <div className="text-xs text-gray-500">
                ສູງສຸດ {MAX_QUANTITY} ໃບ/ຄັ້ງ
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              {/* ปุ่ม - */}
              <button
                onClick={() => changeQuantity(-1)}
                disabled={quantity <= MIN_QUANTITY || loading}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition ${
                  quantity <= MIN_QUANTITY || loading 
                    ? 'border-gray-300 text-gray-300 cursor-not-allowed bg-gray-100' 
                    : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'
                }`}
                title="ລົດ 1 ໃບ"
              >
                −
              </button>
              
              {/* Input field */}
              <div className="flex flex-col items-center">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  disabled={loading}
                  className={`w-20 h-12 text-2xl font-bold text-center border-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-300 bg-white hover:border-blue-300 focus:border-blue-500'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="1"
                  title="ພິມພ໌ຕົວເລກຈຳນວນໃບ (Enter ເພື່ອຢືນຢັນ)"
                />
                
                {/* แสดง error */}
                {error && (
                  <div className="flex items-center mt-1 text-xs text-red-600">
                    <FiAlertCircle className="w-3 h-3 mr-1" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              
              {/* ปุ่ม + */}
              <button
                onClick={() => changeQuantity(1)}
                disabled={quantity >= MAX_QUANTITY || loading}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition ${
                  quantity >= MAX_QUANTITY || loading 
                    ? 'border-gray-300 text-gray-300 cursor-not-allowed bg-gray-100' 
                    : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'
                }`}
                title="ເພີ່ມ 1 ໃບ"
              >
                +
              </button>
            </div>
            
            {/* คำแนะนำการใช้งาน */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                💡 ສາມາດພິມພ໌ຕົວເລກໂດຍກົງ ຫຼື ໃຊ້ປຸ່ມ +/- • Enter ເພື່ອຢືນຢັນ
              </p>
            </div>
          </div>

          {/* ส่วนวิธีการชำระเงิน */}
          <div className="mb-6">
            <div className="text-sm font-semibold mb-2">ວິທີການຊຳລະ</div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${paymentMethod === 'cash' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <span className="font-medium">{getPaymentText(paymentMethod)}</span>
              </div>
            </div>
          </div>

          {/* คำเตือนเมื่อพิมพ์จำนวนมาก */}
          {quantity > 20 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-700 text-sm">
                  <strong>ໝາຍເຫດ:</strong> ທ່ານກຳລັງພິມພ໌ປີ້ຈຳນວນຫລາຍ ({quantity} ໃບ) 
                  ກະລຸນາກວດສອບຄວາມຖືກຕ້ອງ
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 mr-2 font-bold">ໝາຍເຫດ:</div>
              <div className="text-blue-700 text-sm">ກະລຸນາກວດສອບຂໍ້ມູນກ່ອນຢືນຢັນ</div>
            </div>
          </div>
          
          {/* ปุ่มยืนยันและยกเลิก */}
          <div className="flex space-x-3">
            <button
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition border"
              onClick={onCancel}
              disabled={loading}
              title="ຍົກເລີກ (ESC)"
            >
              ຍົກເລີກ
            </button>
            
            <button
              className={`flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center justify-center ${
                loading || !hasValidQuantity ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              onClick={onConfirm}
              disabled={loading || !hasValidQuantity}
              title={hasValidQuantity ? "ຢືນຢັນ (Enter)" : "ກະລຸນາແກ້ໄຂຂໍ້ມູນກ່ອນ"}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ກຳລັງດຳເນີນການ...
                </div>
              ) : 'ຢືນຢັນ'}
            </button>
          </div>
          
          {/* คำแนะนำ keyboard shortcuts */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <div>⌨️ <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> ເພື່ອຢືນຢັນ • <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">ESC</kbd> ເພື່ອຍົກເລີກ</div>
              <div>🖱️ ຄລິກໃສ່ຊ່ອງຕົວເລກເພື່ອພິມພ໌ໂດຍກົງ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketConfirmationModal;