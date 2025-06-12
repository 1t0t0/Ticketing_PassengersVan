'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { 
  Calendar, 
  Users, 
  Phone, 
  User, 
  Mail,
  CreditCard,
  Bus,
  Plus,
  Minus,
  UserCheck
} from 'lucide-react';

interface PassengerInfo {
  name: string;
  phone?: string;
  email?: string;
  age?: string;
}

interface BookingFormData {
  // Trip Details
  travelDate: string;
  passengers: string;
  
  // Main Contact (ผู้ติดต่อหลัก)
  mainContact: {
    name: string;
    phone: string;
    email: string;
  };
  
  // Passenger Details (ข้อมูลผู้โดยสารแต่ละคน)
  passengerList: PassengerInfo[];
}

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    travelDate: '',
    passengers: '1',
    mainContact: {
      name: '',
      phone: '',
      email: ''
    },
    passengerList: [
      { name: '', phone: '', email: '', age: '' }
    ]
  });

  // 🔧 Debug Effect เพื่อดู state changes
  React.useEffect(() => {
    console.log('🔄 FormData changed:', {
      passengers: formData.passengers,
      passengersNum: parseInt(formData.passengers) || 1,
      passengerListLength: formData.passengerList.length,
      passengerList: formData.passengerList
    });
  }, [formData]);

  const basePrice = 45000;
  const passengersNum = parseInt(formData.passengers) || 1;
  const totalAmount = basePrice * passengersNum;

  // อัปเดตจำนวนผู้โดยสาร
  const handlePassengersChange = (value: string) => {
    const newCount = parseInt(value) || 1;
    const currentList = [...formData.passengerList];
    
    console.log('🎯 Changing passengers from', currentList.length, 'to', newCount);
    
    if (newCount > currentList.length) {
      // เพิ่มผู้โดยสาร
      for (let i = currentList.length; i < newCount; i++) {
        currentList.push({ name: '', phone: '', email: '', age: '' });
        console.log('➕ Added passenger', i + 1);
      }
    } else if (newCount < currentList.length) {
      // ลดผู้โดยสาร
      currentList.splice(newCount);
      console.log('➖ Removed passengers, now have', newCount);
    }
    
    setFormData(prev => ({
      ...prev,
      passengers: value,
      passengerList: currentList
    }));
    
    console.log('📋 Updated passenger list:', currentList);
  };

  // อัปเดตข้อมูลผู้ติดต่อหลัก
  const handleMainContactChange = (field: keyof BookingFormData['mainContact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      mainContact: {
        ...prev.mainContact,
        [field]: value
      }
    }));
  };

  // อัปเดตข้อมูลผู้โดยสารแต่ละคน
  const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      passengerList: prev.passengerList.map((passenger, i) => 
        i === index ? { ...passenger, [field]: value } : passenger
      )
    }));
  };

  // คัดลอกข้อมูลจากผู้ติดต่อหลักไปยังผู้โดยสารคนแรก
  const copyMainContactToFirstPassenger = () => {
    if (formData.passengerList.length > 0) {
      setFormData(prev => ({
        ...prev,
        passengerList: prev.passengerList.map((passenger, index) => 
          index === 0 ? {
            ...passenger,
            name: prev.mainContact.name,
            phone: prev.mainContact.phone,
            email: prev.mainContact.email
          } : passenger
        )
      }));
    }
  };

  const validateForm = () => {
    console.log('🔍 Validating form data:', formData);
    
    const passengersNum = parseInt(formData.passengers) || 0;
    const phoneClean = formData.mainContact.phone.trim().replace(/\s+/g, '');
    
    // ตรวจสอบข้อมูลพื้นฐาน
    const basicValid = formData.travelDate && 
           formData.passengers && 
           passengersNum > 0 &&
           passengersNum <= 10 &&
           formData.mainContact.name.trim().length > 0 && 
           formData.mainContact.phone.trim().length > 0 && 
           phoneClean.length >= 6;
    
    // ตรวจสอบข้อมูลผู้โดยสารแต่ละคน
    const passengersValid = formData.passengerList.every((passenger, index) => {
      if (index >= passengersNum) return true; // ไม่ต้องตรวจสอบคนที่เกิน
      return passenger.name.trim().length > 0; // อย่างน้อยต้องมีชื่อ
    });
    
    console.log('Basic valid:', basicValid);
    console.log('Passengers valid:', passengersValid);
    console.log('🎯 Form is valid:', basicValid && passengersValid);
    
    return basicValid && passengersValid;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    console.log('📝 Submit button clicked');
    console.log('Current form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      alert('ກະລຸນາກຮອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ');
      return;
    }

    console.log('✅ Validation passed, proceeding with submission');
    setLoading(true);
    
    try {
      const requestBody = {
        passengerInfo: {
          name: formData.mainContact.name,
          phone: formData.mainContact.phone,
          email: formData.mainContact.email || undefined
        },
        tripDetails: {
          pickupLocation: 'ຈຸດນັດພົບ',
          destination: 'ຕົວເມືອງ',
          travelDate: formData.travelDate,
          travelTime: '08:00',
          passengers: parseInt(formData.passengers)
        },
        basePrice: basePrice,
        // เพิ่มข้อมูลผู้โดยสารทุกคน
        passengerDetails: formData.passengerList.slice(0, passengersNum)
      };
      
      console.log('📤 Sending request:', requestBody);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response data:', result);

      if (response.ok) {
        console.log('✅ Booking created successfully');
        router.push(`/booking/${result.booking._id}/payment`);
      } else {
        console.log('❌ API Error:', result.error);
        alert(result.error || 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງການຈອງ');
      }
    } catch (error) {
      console.error('💥 Network/JS Error:', error);
      alert('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ ກະລຸນາລອງໃໝ່');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bus className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ຈອງປີ້ລົດໂດຍສານ</h1>
                <p className="text-gray-600">ຈອງລ່ວງໜ້າ ສະດວກ ແລະ ປອດໄພ</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/booking/status')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ກວດສອບສະຖານະການຈອງ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">ຂໍ້ມູນການຈອງ</h2>
              
              <div className="space-y-8">
                {/* Date and Passengers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      ວັນທີເດີນທາງ
                    </label>
                    <input
                      type="date"
                      value={formData.travelDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, travelDate: e.target.value }))}
                      min={getTomorrowDate()}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <Users className="w-4 h-4 mr-2 text-purple-600" />
                      ຈຳນວນຜູ້ໂດຍສານ
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.passengers}
                      onChange={(e) => {
                        console.log('🔢 Passengers input changed to:', e.target.value);
                        handlePassengersChange(e.target.value);
                      }}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">ສູງສຸດ 10 ຄົນ</p>
                  </div>
                </div>

                {/* ข้อมูลผู้ติดต่อหลัก */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                    ຂໍ້ມູນຜູ້ຕິດຕໍ່ຫຼັກ
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">ບຸກຄົນທີ່ສາມາດຕິດຕໍ່ໄດ້ສຳລັບການຈອງນີ້</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        ຊື່ຜູ້ຕິດຕໍ່ *
                      </label>
                      <input
                        type="text"
                        value={formData.mainContact.name}
                        onChange={(e) => handleMainContactChange('name', e.target.value)}
                        placeholder="ໃສ່ຊື່ຜູ້ຕິດຕໍ່"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        ເບີໂທຕິດຕໍ່ *
                      </label>
                      <input
                        type="tel"
                        value={formData.mainContact.phone}
                        onChange={(e) => handleMainContactChange('phone', e.target.value)}
                        placeholder="020 1234 5678"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 mr-2 text-purple-600" />
                      ອີເມວ (ບໍ່ບັງຄັບ)
                    </label>
                    <input
                      type="email"
                      value={formData.mainContact.email}
                      onChange={(e) => handleMainContactChange('email', e.target.value)}
                      placeholder="example@email.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* ข้อมูลผู้โดยสารแต่ละคน */}
                {passengersNum > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        ຂໍ້ມູນຜູ້ໂດຍສານ ({passengersNum} ຄົນ)
                      </h3>
                      {formData.passengerList.length > 0 && (
                        <button
                          type="button"
                          onClick={copyMainContactToFirstPassenger}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          📋 ຄັດລອກຜູ້ຕິດຕໍ່ຫຼັກໄປຄົນທີ 1
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {formData.passengerList.slice(0, passengersNum).map((passenger, index) => (
                        <div key={`passenger-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-fadeIn">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">
                              {index + 1}
                            </span>
                            ຜູ້ໂດຍສານຄົນທີ {index + 1}
                            {index === 0 && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                ຫຼັກ
                              </span>
                            )}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ຊື່ ແລະ ນາມສະກຸນ *
                              </label>
                              <input
                                type="text"
                                value={passenger.name}
                                onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                                placeholder={`ໃສ່ຊື່ຜູ້ໂດຍສານຄົນທີ ${index + 1}`}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ເບີໂທ (ບໍ່ບັງຄັບ)
                              </label>
                              <input
                                type="tel"
                                value={passenger.phone || ''}
                                onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                                placeholder="020 1234 5678"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ອາຍຸ (ບໍ່ບັງຄັບ)
                              </label>
                              <input
                                type="number"
                                value={passenger.age || ''}
                                onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                                placeholder="25"
                                min="1"
                                max="100"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Debug Info */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <strong>Debug:</strong> 
                      <br />จำนวนที่เลือก: {passengersNum}
                      <br />จำนวนในอาร์เรย์: {formData.passengerList.length}
                      <br />แสดงฟอร์ม: {formData.passengerList.slice(0, passengersNum).length} คน
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !validateForm()}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center ${
                    validateForm() && !loading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <span className="flex items-center">
                      ຢືນຢັນການຈອງ
                      <CreditCard className="w-5 h-5 ml-2" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ສະຫຼຸບການຈອງ</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ປາຍທາງ:</span>
                  <span className="font-medium text-right">ຕົວເມືອງ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ວັນທີ:</span>
                  <span className="font-medium">
                    {formData.travelDate ? new Date(formData.travelDate).toLocaleDateString('lo-LA') : 'ຍັງບໍ່ໄດ້ເລືອກ'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ຈຳນວນຄົນ:</span>
                  <span className="font-medium">{passengersNum} ຄົນ</span>
                </div>
              </div>

              <hr className="my-4" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ລາຄາຕໍ່ຄົນ:</span>
                  <span className="font-medium">₭{basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ຈຳນວນຄົນ:</span>
                  <span className="font-medium">{passengersNum} ຄົນ</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">ລາຄາລວມ:</span>
                  <span className="text-2xl font-bold text-blue-600">₭{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Passenger List Preview */}
              {passengersNum > 0 && formData.passengerList.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">ລາຍຊື່ຜູ້ໂດຍສານ:</h4>
                  <div className="space-y-2">
                    {formData.passengerList.slice(0, passengersNum).map((passenger, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs mr-2">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">
                          {passenger.name || `ຜູ້ໂດຍສານຄົນທີ ${index + 1}`}
                          {passenger.age && ` (${passenger.age} ປີ)`}
                        </span>
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                            ຫຼັກ
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* ตัวอย่างการแสดงข้อมูล Debug */}
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                    <strong>Debug Summary:</strong>
                    <br />✅ ผู้โดยสาร: {passengersNum} คน
                    <br />✅ ฟอร์มที่มี: {formData.passengerList.length} ชุด
                    <br />✅ แสดงผล: {formData.passengerList.slice(0, passengersNum).length} คน
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">ຂໍ້ມູນສຳຄັນ</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• ປາຍທາງ: ພາຍໃນຕົວເມືອງ</li>
                    <li>• ເວລາອອກເດີນທາງ 08:00 ໂມງເຊົ້າ</li>
                    <li>• ການຈອງໝົດອາຍຸພາຍໃນ 24 ຊົວໂມງ</li>
                    <li>• ບອກຈຸດໝາຍປາຍທາງໃຫ້ຄົນຂັບຟັງ</li>
                    <li>• ກະລຸນາມາຮອດກ່ອນເວລາ 15 ນາທີ</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}