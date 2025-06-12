'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  Phone, 
  User, 
  Mail,
  CreditCard,
  Bus
} from 'lucide-react';

interface BookingFormData {
  // Trip Details
  travelDate: string;
  passengers: string; // Changed to string for input
  
  // Passenger Info
  name: string;
  phone: string;
  email: string;
}

const popularDestinations = [];

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    travelDate: '',
    passengers: '1',
    name: '',
    phone: '',
    email: ''
  });

  const basePrice = 45000; // 45,000 Kip per person
  const passengersNum = parseInt(formData.passengers) || 1;
  const totalAmount = basePrice * passengersNum;

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const passengersNum = parseInt(formData.passengers) || 0;
    const phoneClean = formData.phone.trim().replace(/\s+/g, ''); // Remove spaces
    
    return formData.travelDate && 
           formData.passengers && 
           passengersNum > 0 &&
           passengersNum <= 10 &&
           formData.name.trim().length > 0 && 
           formData.phone.trim().length > 0 && 
           phoneClean.length >= 6; // More flexible phone validation
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
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passengerInfo: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined
          },
          tripDetails: {
            pickupLocation: 'ຈຸດນັດພົບ', // Default pickup location
            destination: 'ຕົວເມືອງ', // Fixed destination - in town
            travelDate: formData.travelDate,
            travelTime: '08:00', // Default time
            passengers: parseInt(formData.passengers)
          },
          basePrice: basePrice
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // นำทางไปหน้าชำระเงิน
        router.push(`/booking/${result.booking._id}/payment`);
      } else {
        alert(result.error || 'ເກີດຂໍ້ຜິດພາດໃນການສ້າງການຈອງ');
      }
    } catch (error) {
      console.error('Booking error:', error);
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
          
          {/* Main Form - Left Side */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">ຂໍ້ມູນການຈອງ</h2>
              
              <div className="space-y-6">
                {/* Date and Passengers Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Travel Date */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      ວັນທີເດີນທາງ
                    </label>
                    <input
                      type="date"
                      value={formData.travelDate}
                      onChange={(e) => handleInputChange('travelDate', e.target.value)}
                      min={getTomorrowDate()}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    />
                  </div>

                  {/* Passengers */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <Users className="w-4 h-4 mr-2 text-purple-600" />
                      ຈຳນວນຜູ້ໂດຍສາຍ
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.passengers}
                      onChange={(e) => handleInputChange('passengers', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">ສູງສຸດ 10 ຄົນ</p>
                  </div>
                </div>

                {/* Passenger Information */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">ຂໍ້ມູນຜູ້ຕິດຕໍ່</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-blue-600" />
                        ຊື່ ແລະ ນາມສະກຸນ *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="ໃສ່ຊື່ ແລະ ນາມສະກຸນ"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        ເບີໂທ *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="020 1234 5678"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mt-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 mr-2 text-purple-600" />
                      ອີເມວ (ບໍ່ບັງຄັບ)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="example@email.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!validateForm() || loading}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

          {/* Price Summary - Right Side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ສະຫຼຸບການຈອງ</h3>
              
              {/* Trip Summary */}
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

              {/* Price Breakdown */}
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

              {/* Additional Info */}
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