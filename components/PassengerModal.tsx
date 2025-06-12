// components/PassengerModal.tsx - Modal สำหรับเพิ่มผู้โดยสาร
'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, Plus } from 'lucide-react';

interface PassengerInfo {
  name: string;
  phone?: string;
  email?: string;
  age?: string;
}

interface PassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  passengers: PassengerInfo[];
  onSave: (passengers: PassengerInfo[]) => void;
  maxPassengers: number;
  mainContact: {
    name: string;
    phone: string;
    email: string;
  };
}

export default function PassengerModal({ 
  isOpen, 
  onClose, 
  passengers, 
  onSave, 
  maxPassengers,
  mainContact 
}: PassengerModalProps) {
  const [localPassengers, setLocalPassengers] = useState<PassengerInfo[]>([]);

  // อัปเดต local state เมื่อ modal เปิด
  useEffect(() => {
    if (isOpen) {
      // ถ้ายังไม่มีผู้โดยสาร ให้เริ่มต้นด้วยคนแรก
      if (passengers.length === 0) {
        setLocalPassengers([{ name: '', phone: '', email: '', age: '' }]);
      } else {
        setLocalPassengers([...passengers]);
      }
    }
  }, [isOpen, passengers]);

  if (!isOpen) return null;

  // เพิ่มผู้โดยสาร
  const addPassenger = () => {
    if (localPassengers.length < maxPassengers) {
      setLocalPassengers([...localPassengers, { name: '', phone: '', email: '', age: '' }]);
    }
  };

  // ลบผู้โดยสาร
  const removePassenger = (index: number) => {
    if (localPassengers.length > 1) {
      setLocalPassengers(localPassengers.filter((_, i) => i !== index));
    }
  };

  // อัปเดตข้อมูลผู้โดยสาร
  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    setLocalPassengers(prev => prev.map((passenger, i) => 
      i === index ? { ...passenger, [field]: value } : passenger
    ));
  };

  // คัดลอกข้อมูลจากผู้ติดต่อหลัก
  const copyMainContact = (index: number) => {
    updatePassenger(index, 'name', mainContact.name);
    updatePassenger(index, 'phone', mainContact.phone);
    updatePassenger(index, 'email', mainContact.email);
  };

  // บันทึก
  const handleSave = () => {
    // ตรวจสอบว่าทุกคนมีชื่อ
    const isValid = localPassengers.every(p => p.name.trim().length > 0);
    if (!isValid) {
      alert('ກະລຸນາໃສ່ຊື່ຜູ້ໂດຍສານໃຫ້ຄົບທຸກຄົນ');
      return;
    }

    onSave(localPassengers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div>
              <h2 className="text-xl font-bold">ຂໍ້ມູນຼູ້ໂດຍສານ</h2>
              <p className="text-blue-100 text-sm">
                {localPassengers.length}/{maxPassengers} ຄົນ
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-6">
            <div className="space-y-6">
              {localPassengers.map((passenger, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  
                  {/* Header ของผู้โดยสารแต่ละคน */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          ຜູ້ໂດຍສານຄົນທີ {index + 1}
                        </h3>
                        {index === 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ຜູ້ໂດຍສານຫຼັກ
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* ปุ่มคัดลอกจากผู้ติดต่อหลัก */}
                      {mainContact.name && (
                        <button
                          type="button"
                          onClick={() => copyMainContact(index)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          📋 ຄັດລອກຜູ້ຕິດຕໍ່
                        </button>
                      )}
                      
                      {/* ปุ่มลบ (ถ้ามีมากกว่า 1 คน) */}
                      {localPassengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ฟอร์มข้อมูล */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-blue-500" />
                        ຊື່ ແລະ ນາມສະກຸນ *
                      </label>
                      <input
                        type="text"
                        value={passenger.name}
                        onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                        placeholder={`ໃສ່ຊື່ຜູ້ໂດຍສານຄົນທີ ${index + 1}`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 mr-2 text-green-500" />
                        ເບີໂທ
                      </label>
                      <input
                        type="tel"
                        value={passenger.phone || ''}
                        onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                        placeholder="020 1234 5678"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                        ອາຍຸ
                      </label>
                      <input
                        type="number"
                        value={passenger.age || ''}
                        onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                        placeholder="25"
                        min="1"
                        max="100"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* ปุ่มเพิ่มผู้โดยสาร */}
              {localPassengers.length < maxPassengers && (
                <button
                  type="button"
                  onClick={addPassenger}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center text-gray-600 hover:text-blue-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  ເພີ່ມຜູ້ໂດຍສານ ({localPassengers.length}/{maxPassengers})
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                ບັນທຶກ ({localPassengers.length} ຄົນ)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 