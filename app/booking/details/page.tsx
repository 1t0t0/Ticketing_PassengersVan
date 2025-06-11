'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, User, Phone, ArrowLeft, ArrowRight, AlertCircle, Users, Calendar } from 'lucide-react';
import { validateBookingData, formatDateLao, isValidEmail } from '@/lib/bookingUtils';

interface PassengerData {
  email: string;
  error?: string;
}

export default function BookingDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ข้อมูลจากหน้าก่อน
  const travelDate = searchParams.get('travel_date') || '';
  const totalTickets = parseInt(searchParams.get('total_tickets') || '1');
  const totalPrice = parseInt(searchParams.get('total_price') || '0');
  
  // ข้อมูลผู้จอง
  const [bookerEmail, setBookerEmail] = useState('');
  const [bookerName, setBookerName] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  
  // ข้อมูลผู้โดยสาร
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  
  // สถานะ
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // เริ่มต้นข้อมูลผู้โดยสาร
  useEffect(() => {
    if (totalTickets > 0) {
      const initialPassengers = Array.from({ length: totalTickets }, (_, index) => ({
        email: index === 0 ? bookerEmail : '', // คนแรกใช้ email เดียวกับผู้จอง
        error: undefined
      }));
      setPassengers(initialPassengers);
    }
  }, [totalTickets]);

  // อัปเดต email ผู้โดยสารคนแรกเมื่อ bookerEmail เปลี่ยน
  useEffect(() => {
    if (passengers.length > 0 && bookerEmail) {
      setPassengers(prev => prev.map((passenger, index) => 
        index === 0 ? { ...passenger, email: bookerEmail } : passenger
      ));
    }
  }, [bookerEmail]);

  // ตรวจสอบข้อมูลเมื่อเกิดการเปลี่ยนแปลง
  useEffect(() => {
    validateForm();
  }, [bookerEmail, bookerName, bookerPhone, passengers]);

  const validateForm = () => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // ตรวจสอบข้อมูลผู้จอง
    if (!bookerEmail) {
      newErrors.push('กรุณากรอก Email ผู้จอง');
    } else if (!isValidEmail(bookerEmail)) {
      newErrors.push('รูปแบบ Email ผู้จองไม่ถูกต้อง');
    }

    if (!bookerName.trim()) {
      newErrors.push('กรุณากรอกชื่อผู้จอง');
    }

    // ตรวจสอบ email ผู้โดยสาร
    const passengerEmails = passengers.map(p => p.email.toLowerCase().trim()).filter(e => e);
    const uniqueEmails = new Set(passengerEmails);
    
    if (uniqueEmails.size !== passengerEmails.length) {
      newErrors.push('พบ Email ผู้โดยสารซ้ำกัน');
    }

    passengers.forEach((passenger, index) => {
      if (!passenger.email) {
        newErrors.push(`กรุณากรอก Email ผู้โดยสารคนที่ ${index + 1}`);
      } else if (!isValidEmail(passenger.email)) {
        newErrors.push(`Email ผู้โดยสารคนที่ ${index + 1} ไม่ถูกต้อง`);
      }
    });

    // ตรวจสอบเบอร์โทร (ถ้ามี)
    if (bookerPhone && !/^(\+?856|0)[2-9]\d{7,8}$/.test(bookerPhone.replace(/[\s-]/g, ''))) {
      newWarnings.push('รูปแบบเบอร์โทรศัพท์อาจไม่ถูกต้อง');
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
  };

  const updatePassengerEmail = (index: number, email: string) => {
    setPassengers(prev => prev.map((passenger, i) => 
      i === index ? { ...passenger, email, error: undefined } : passenger
    ));
  };

  const fillAllWithBookerEmail = () => {
    if (bookerEmail && passengers.length > 0) {
      setPassengers(prev => prev.map(passenger => ({ 
        ...passenger, 
        email: bookerEmail,
        error: undefined 
      })));
    }
  };

  const handleSubmit = async () => {
    if (errors.length > 0) {
      alert('กรุณาแก้ไขข้อผิดพลาดก่อนดำเนินการต่อ');
      return;
    }

    setLoading(true);

    try {
      const passengerEmails = passengers.map(p => p.email.toLowerCase().trim());
      
      // ส่งข้อมูลไป API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          travel_date: travelDate,
          total_tickets: totalTickets,
          booker_email: bookerEmail.toLowerCase().trim(),
          booker_name: bookerName.trim(),
          booker_phone: bookerPhone.trim() || undefined,
          passenger_emails: passengerEmails
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการสร้างการจอง');
      }

      console.log('Booking created successfully:', result.booking.booking_id);

      // ไปหน้าชำระเงิน
      router.push(`/booking/payment/${result.booking.id}`);

    } catch (error) {
      console.error('Booking error:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lo-LA').format(amount) + ' ₭';
  };

  if (!travelDate || totalTickets < 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">ข้อมูลไม่ครบถ้วน</h1>
          <p className="text-gray-600 mb-4">กรุณาเลือกวันที่และจำนวนตั๋วก่อน</p>
          <button
            onClick={() => router.push('/booking')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            กลับไปเลือกวันที่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ຂໍ້ມູນຜູ້ໂດຍສານ</h1>
                <p className="text-gray-600">ກະລຸນາໃສ່ Email ຂອງຜູ້ໂດຍສານແຕ່ລະຄົນ</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <div className="flex items-center text-green-600">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                <span className="ml-2">ເລືອກວັນທີ່</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center text-blue-600">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <span className="ml-2">ຂໍ້ມູນຜູ້ໂດຍສານ</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center text-gray-400">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                <span className="ml-2">ຊຳລະເງິນ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* ฟอร์มกรอกข้อมูล */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ข้อมูลผู้จอง */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                ຂໍ້ມູນຜູ້ຈອງ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email ຜູ້ຈອງ *
                  </label>
                  <input
                    type="email"
                    value={bookerEmail}
                    onChange={(e) => setBookerEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ຊື່-ນາມສະກຸນ *
                  </label>
                  <input
                    type="text"
                    value={bookerName}
                    onChange={(e) => setBookerName(e.target.value)}
                    placeholder="ຊື່ ແລະ ນາມສະກຸນ"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ເບີໂທລະສັບ (ທາງເລືອກ)
                  </label>
                  <input
                    type="tel"
                    value={bookerPhone}
                    onChange={(e) => setBookerPhone(e.target.value)}
                    placeholder="020 1234 5678"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลผู้โดยสาร */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Email ຜູ້ໂດຍສານ ({totalTickets} ຄົນ)
                </h3>
                
                {totalTickets > 1 && (
                  <button
                    onClick={fillAllWithBookerEmail}
                    disabled={!bookerEmail}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    ໃຊ້ Email ເດຍວກັນທົ່ງໝົດ
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {passengers.map((passenger, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      ຜູ້ໂດຍສານຄົນທີ່ {index + 1} {index === 0 && '(ຜູ້ຈອງ)'}
                    </label>
                    <input
                      type="email"
                      value={passenger.email}
                      onChange={(e) => updatePassengerEmail(index, e.target.value)}
                      placeholder={`passenger${index + 1}@example.com`}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none ${
                        passenger.error 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {passenger.error && (
                      <p className="mt-1 text-sm text-red-600">{passenger.error}</p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold">ຫມາຍເຫດສຳຄັນ:</p>
                    <p className="mt-1">ຕີ້ແຕ່ລະໃບຈະຖືກສົ່ງໄປຍັງ Email ຂອງຜູ້ໂດຍສານແຕ່ລະຄົນ ກະລຸນາໃສ່ Email ທີ່ຖືກຕ້ອງ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อผิดพลาดและคำเตือน */}
            {(errors.length > 0 || warnings.length > 0) && (
              <div className="space-y-3">
                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-red-800">ກະລຸນາແກ້ໄຂຂໍ້ຜິດພາດ:</h4>
                        <ul className="mt-2 space-y-1">
                          {errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">ຄຳເຕືອນ:</h4>
                        <ul className="mt-2 space-y-1">
                          {warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ปุ่มดำเนินการ */}
            <div className="flex space-x-4">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>ກັບຄືນ</span>
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={errors.length > 0 || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>ກຳລັງສ້າງການຈອງ...</span>
                  </>
                ) : (
                  <>
                    <span>ສ້າງການຈອງ</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* สรุปการจอง */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 ສະຫຼຸບການຈອງ</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">ວັນທີ່ເດີນທາງ:</span>
                  <span className="font-semibold">{formatDateLao(travelDate)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ຈຳນວນຜູ້ໂດຍສານ:</span>
                  <span className="font-semibold">{totalTickets} ຄົນ</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">ລາຄາຕໍ່ຄົນ:</span>
                  <span className="font-semibold">{formatPrice(totalPrice / totalTickets)}</span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">ລາຄາລວມ:</span>
                  <span className="font-bold text-blue-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold">ຂັ້ນຕອນຕໍ່ໄປ:</p>
                    <p className="mt-1">ຫຼັງຈາກສ້າງການຈອງແລ້ວ ທ່ານຈະໄດ້ຮັບເລກຈອງ ແລະ ຂໍ້ມູນການໂອນເງິນ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}