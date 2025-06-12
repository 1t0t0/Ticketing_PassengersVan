// app/booking/page.tsx - Updated with Modal Design
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  Phone, 
  User, 
  Mail,
  CreditCard,
  Bus,
  UserCheck,
  Edit3,
  MapPin,
  Clock
} from 'lucide-react';
import PassengerModal from '@/components/PassengerModal';

interface PassengerInfo {
  name: string;
  phone?: string;
  email?: string;
  age?: string;
}

interface BookingFormData {
  travelDate: string;
  passengers: string;
  mainContact: {
    name: string;
    phone: string;
    email: string;
  };
  passengerList: PassengerInfo[];
}

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    travelDate: '',
    passengers: '1',
    mainContact: {
      name: '',
      phone: '',
      email: ''
    },
    passengerList: []
  });

  const basePrice = 45000;
  const passengersNum = parseInt(formData.passengers) || 1;
  const totalAmount = basePrice * passengersNum;

  // อัปเดตจำนวนผู้โดยสาร
  const handlePassengersChange = (value: string) => {
    const newCount = parseInt(value) || 1;
    
    setFormData(prev => ({
      ...prev,
      passengers: value,
      // รีเซ็ต passenger list ถ้าจำนวนเปลี่ยน
      passengerList: prev.passengerList.length !== newCount ? [] : prev.passengerList
    }));
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

  // บันทึกข้อมูลผู้โดยสารจาก Modal
  const handlePassengersSave = (passengers: PassengerInfo[]) => {
    setFormData(prev => ({
      ...prev,
      passengerList: passengers
    }));
  };

  // ตรวจสอบความถูกต้องของฟอร์ม
  const validateForm = () => {
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
    
    // ตรวจสอบข้อมูลผู้โดยสาร
    const passengersValid = formData.passengerList.length === passengersNum &&
           formData.passengerList.every(passenger => passenger.name.trim().length > 0);
    
    return basicValid && passengersValid;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('ກະລຸນາກຮອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ');
      return;
    }

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
        passengerDetails: formData.passengerList
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/booking/${result.booking._id}/payment`);
      } else {
        alert(result.error || 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງການຈອງ');
      }
    } catch (error) {
      console.error('Network/JS Error:', error);
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
                
                {/* Trip Information */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    ຂໍ້ມູນການເດີນທາງ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">ຈຸດຂຶ້ນ:</span>
                      <span className="font-medium">ຈຸດນັດພົບ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">ປາຍທາງ:</span>
                      <span className="font-medium">ຕົວເມືອງ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">ເວລາອອກ:</span>
                      <span className="font-medium flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        08:00 ໂມງເຊົ້າ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">ລາຄາ:</span>
                      <span className="font-medium">₭{basePrice.toLocaleString()}/ຄົນ</span>
                    </div>
                  </div>
                </div>

                {/* Date and Passengers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      ວັນທີເດີນທາງ *
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
                      ຈຳນວນຜູ້ໂດຍສານ *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.passengers}
                      onChange={(e) => handlePassengersChange(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">ສູງສຸດ 10 ຄົນ</p>
                  </div>
                </div>

                {/* Main Contact */}
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

                {/* Passenger List Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      ຂໍ້ມູນຜູ້ໂດຍສານ ({passengersNum} ຄົນ)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPassengerModal(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {formData.passengerList.length === 0 ? 'ເພີ່ມຜູ້ໂດຍສານ' : 'ແກ້ໄຂຂໍ້ມູນ'}
                    </button>
                  </div>

                  {/* Passenger Summary */}
                  {formData.passengerList.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-3">✅ ຂໍ້ມູນຜູ້ໂດຍສານ ({formData.passengerList.length} ຄົນ)</h4>
                      <div className="space-y-2">
                        {formData.passengerList.map((passenger, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                            <div className="flex items-center">
                              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                {index + 1}
                              </span>
                              <div>
                                <div className="font-medium">{passenger.name}</div>
                                {passenger.phone && (
                                  <div className="text-sm text-gray-600">{passenger.phone}</div>
                                )}
                              </div>
                            </div>
                            {passenger.age && (
                              <span className="text-sm text-gray-500">{passenger.age} ປີ</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <Users className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                      <p className="text-yellow-800 font-medium">ຍັງບໍ່ໄດ້ເພີ່ມຂໍ້ມູນຜູ້ໂດຍສານ</p>
                      <p className="text-yellow-600 text-sm">ກົດປຸ່ມ "ເພີ່ມຜູ້ໂດຍສານ" ເພື່ອເພີ່ມຂໍ້ມູນ {passengersNum} ຄົນ</p>
                    </div>
                  )}
                </div>

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

              {/* Validation Status */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className={`flex items-center text-sm ${formData.travelDate ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full mr-2 ${formData.travelDate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    ວັນທີເດີນທາງ
                  </div>
                  <div className={`flex items-center text-sm ${formData.mainContact.name && formData.mainContact.phone ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full mr-2 ${formData.mainContact.name && formData.mainContact.phone ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    ຂໍ້ມູນຜູ້ຕິດຕໍ່
                  </div>
                  <div className={`flex items-center text-sm ${formData.passengerList.length === passengersNum && formData.passengerList.every(p => p.name.trim()) ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-4 h-4 rounded-full mr-2 ${formData.passengerList.length === passengersNum && formData.passengerList.every(p => p.name.trim()) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    ຂໍ້ມູນຼູ້ໂດຍສານ ({formData.passengerList.length}/{passengersNum})
                  </div>
                </div>
              </div>

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

      {/* Passenger Modal */}
      <PassengerModal
        isOpen={showPassengerModal}
        onClose={() => setShowPassengerModal(false)}
        passengers={formData.passengerList}
        onSave={handlePassengersSave}
        maxPassengers={passengersNum}
        mainContact={formData.mainContact}
      />
    </div>
  );
}