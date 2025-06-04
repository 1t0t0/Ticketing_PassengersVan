import React, { useState, useEffect } from 'react';
import { FiClock, FiSave, FiX, FiSettings, FiRefreshCw } from 'react-icons/fi';
import notificationService from '@/lib/notificationService';

interface AutoCheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface AutoCheckoutSettings {
  enabled: boolean;
  checkoutTime: string; // Format: "HH:MM"
  timezone: string;
  lastRun?: string;
  affectedUsers?: number;
}

const AutoCheckoutModal: React.FC<AutoCheckoutModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settings, setSettings] = useState<AutoCheckoutSettings>({
    enabled: false,
    checkoutTime: '17:30',
    timezone: 'Asia/Vientiane',
    lastRun: undefined,
    affectedUsers: 0
  });

  const [manualCheckoutLoading, setManualCheckoutLoading] = useState(false);

  // โหลดการตั้งค่าปัจจุบัน
  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/auto-checkout/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching auto checkout settings:', error);
      notificationService.error('ບໍ່ສາມາດໂຫລດການຕັ້ງຄ່າໄດ້');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      
      const response = await fetch('/api/admin/auto-checkout/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      notificationService.success('ບັນທຶກການຕັ້ງຄ່າສຳເລັດແລ້ວ');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const runManualCheckout = async () => {
    try {
      setManualCheckoutLoading(true);
      
      const response = await fetch('/api/admin/auto-checkout/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run checkout');
      }

      const result = await response.json();
      
      notificationService.success(
        `ດຳເນີນການ Auto Checkout ສຳເລັດ: ${result.checkedOutCount} ຄົນ`
      );
      
      // รีโหลดการตั้งค่าเพื่ອแสดงข้อมูลล่าสุด
      await fetchCurrentSettings();
      onSuccess();
    } catch (error: any) {
      console.error('Error running manual checkout:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
    } finally {
      setManualCheckoutLoading(false);
    }
  };

  const updateSettings = (field: keyof AutoCheckoutSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const formatLastRun = (lastRun?: string) => {
    if (!lastRun) return 'ຍັງບໍ່ເຄີຍດຳເນີນການ';
    
    try {
      const date = new Date(lastRun);
      return date.toLocaleString('lo-LA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">ກຳລັງໂຫລດ...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiClock className="mr-3" size={24} />
              <div>
                <h2 className="text-xl font-bold">ການຕັ້ງຄ່າ Auto Checkout</h2>
                <p className="text-orange-100 text-sm mt-1">
                  ກຳນົດເວລາໃຫ້ລະບົບເຊັກເອົາອັດຕະໂນມັດ
                </p>
              </div>
            </div>
            <button 
              className="text-white hover:bg-orange-600 rounded-full p-2 transition-colors"
              onClick={onClose}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">ເປີດໃຊ້ງານ Auto Checkout</h3>
              <p className="text-sm text-gray-600">
                ລະບົບຈະເຊັກເອົາໃຫ້ຜູ້ໃຊ້ອັດຕະໂນມັດຕາມເວລາທີ່ກຳນົດ
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => updateSettings('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {/* Time Setting */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <FiSettings className="mr-2" />
              ການຕັ້ງຄ່າເວລາ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ເວລາ Auto Checkout
                </label>
                <input
                  type="time"
                  value={settings.checkoutTime}
                  onChange={(e) => updateSettings('checkoutTime', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                  disabled={!settings.enabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ລະບົບຈະເຊັກເອົາໃຫ້ທຸກຄົນທີ່ຍັງເຊັກອິນຢູ່
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ເຂດເວລາ
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSettings('timezone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:outline-none"
                  disabled={!settings.enabled}
                >
                  <option value="Asia/Vientiane">ລາວ (UTC+7)</option>
                  <option value="Asia/Bangkok">ໄທ (UTC+7)</option>
                  <option value="Asia/Ho_Chi_Minh">ຫວຽດນາມ (UTC+7)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">ສະຖານະການດຳເນີນງານ</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-600">ສະຖານະ:</span>
                <span className={`font-medium ${settings.enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {settings.enabled ? 'ເປີດໃຊ້ງານ' : 'ປິດໃຊ້ງານ'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-blue-600">ເຊັກເອົາຄັ້ງສຸດທ້າຍ:</span>
                <span className="font-medium text-gray-700">
                  {formatLastRun(settings.lastRun)}
                </span>
              </div>
              
              {settings.affectedUsers !== undefined && (
                <div className="flex justify-between">
                  <span className="text-blue-600">ຜູ້ໃຊ້ທີ່ຖືກກະທົບ:</span>
                  <span className="font-medium text-gray-700">
                    {settings.affectedUsers} ຄົນ
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Manual Run Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">ດຳເນີນການທັນທີ</h3>
            <p className="text-sm text-gray-600 mb-4">
              ເຊັກເອົາໃຫ້ຜູ້ໃຊ້ທີ່ຍັງເຊັກອິນຢູ່ທັງໝົດທັນທີ (ບໍ່ຕ້ອງລໍຖ້າເວລາທີ່ກຳນົດ)
            </p>
            
            <button
              onClick={runManualCheckout}
              disabled={manualCheckoutLoading}
              className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {manualCheckoutLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ກຳລັງດຳເນີນການ...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" size={16} />
                  ດຳເນີນການທັນທີ
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={onClose}
              disabled={savingSettings}
            >
              ຍົກເລີກ
            </button>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSettings ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ກຳລັງບັນທຶກ...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" size={16} />
                  ບັນທຶກການຕັ້ງຄ່າ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoCheckoutModal;