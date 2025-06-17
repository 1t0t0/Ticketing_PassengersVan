// app/dashboard/tickets/components/AdminSettingsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiX, FiSave, FiDollarSign, FiSettings,
  FiAlertCircle
} from 'react-icons/fi';
import notificationService from '@/lib/notificationService';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdate?: () => void;
}

interface TicketPriceData {
  ticketPrice: number;
}

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen, onClose, onSettingsUpdate
}) => {
  // States
  const [saving, setSaving] = useState(false);
  
  // Ticket Price States
  const [ticketPrice, setTicketPrice] = useState(45000);
  const [priceLoading, setPriceLoading] = useState(true);

  // ฟังก์ชันดึงราคาปี้
  const fetchTicketPrice = async () => {
    try {
      setPriceLoading(true);
      const response = await fetch('/api/admin/ticket-price');
      const data = await response.json();
      
      if (data.success) {
        setTicketPrice(data.ticketPrice);
      } else {
        notificationService.error('ไม่สามารถดึงราคาปี้ได้');
      }
    } catch (error) {
      console.error('Error fetching ticket price:', error);
      notificationService.error('เกิดข้อผิดพลาดในการดึงราคาปี้');
    } finally {
      setPriceLoading(false);
    }
  };

  // ฟังก์ชันบันทึกราคาปี้
  const saveTicketPrice = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/ticket-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: ticketPrice })
      });
      
      const data = await response.json();
      
      if (data.success) {
        notificationService.success(data.message || 'อัปเดตราคาปี้สำเร็จ');
        onSettingsUpdate?.(); // ✅ รีเฟรชข้อมูลหน้าขายปี้
        onClose(); // ✅ ปิด Modal หลังบันทึกสำเร็จ
      } else {
        notificationService.error(data.error || 'ไม่สามารถอัปเดตราคาปี้ได้');
      }
    } catch (error) {
      console.error('Error saving ticket price:', error);
      notificationService.error('เกิดข้อผิดพลาดในการบันทึกราคาปี้');
    } finally {
      setSaving(false);
    }
  };

  // โหลดข้อมูลเมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      fetchTicketPrice();
    }
  }, [isOpen]);

  // ปิด Modal
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center">
            <FiSettings className="mr-3 h-6 w-6" />
            <h2 className="text-xl font-bold">ການຕັ້ງຄ່າລາຄາປີ້</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ຕັ້ງລາຄາປີ້ມາດຕະຖານ</h3>
              <p className="text-sm text-gray-600">ລາຄານີ້ຈະນຳໄປໃຊ້ສຳລັບການອອກປີ້ໃໝ່ທັງໝົດ</p>
            </div>

            {priceLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">ກຳລັງໂຫລດ...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ລາຄາປີ້ (ກີບ)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₭</span>
                    <input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1000"
                      max="1000000"
                      step="1000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ລາຄາປັດຈຸບັນ: ₭{ticketPrice.toLocaleString()}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">ໝາຍເຫດສຳຄັນ</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        ການປ່ຽນລາຄາຈະມີຜົນກັບປີ້ໃໝ່ທີ່ອອກຫຼັງຈາກນີ້ເທົ່ານັ້ນ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            ປິດ
          </button>
          
          <button
            onClick={saveTicketPrice}
            disabled={saving}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ກຳລັງບັນທຶກ...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                ບັນທຶກການຕັ້ງຄ່າ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsModal;