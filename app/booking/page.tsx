'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, ArrowRight, Clock, MapPin, AlertCircle } from 'lucide-react';
import { getAvailableDates, calculateBookingPrice, formatDateLao, BOOKING_CONSTANTS } from '@/lib/bookingUtils';

interface TravelDateInfo {
  date: string;
  dayName: string;
  isWeekend: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  daysFromNow: number;
}

export default function BookingPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [availableDates, setAvailableDates] = useState<TravelDateInfo[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // โหลดวันที่ที่สามารถจองได้
  useEffect(() => {
    const dates = getAvailableDates();
    setAvailableDates(dates);
    
    // เลือกวันพรุ่งนี้เป็นค่าเริ่มต้น (ถ้ามี)
    const tomorrow = dates.find(d => d.isTomorrow);
    if (tomorrow) {
      setSelectedDate(tomorrow.date);
    } else if (dates.length > 0) {
      setSelectedDate(dates[0].date);
    }
  }, []);

  // คำนวณราคาเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (selectedDate && ticketCount > 0) {
      const price = calculateBookingPrice(ticketCount, selectedDate);
      setPricing(price);
    }
  }, [selectedDate, ticketCount]);

  const handleSubmit = () => {
    if (!selectedDate || ticketCount < 1) {
      alert('กรุณาเลือกวันที่และจำนวนตั๋ว');
      return;
    }

    setLoading(true);
    
    // ส่งข้อมูลไปหน้าถัดไป
    const searchParams = new URLSearchParams({
      travel_date: selectedDate,
      total_tickets: ticketCount.toString(),
      total_price: pricing?.totalPrice.toString() || '0'
    });
    
    router.push(`/booking/details?${searchParams.toString()}`);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lo-LA').format(amount) + ' ₭';
  };

  const selectedDateInfo = availableDates.find(d => d.date === selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ຈອງປີ້ລົດເມ</h1>
              <p className="text-gray-600">ເລືອກວັນທີ່ ແລະ ຈຳນວນຜູ້ໂດຍສານ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* ฟอร์มการจอง */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              
              {/* เส้นทาง */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">ສະຖານີລົດໄຟ</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">ຕົວເມືອງ</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  <Clock className="inline w-4 h-4 mr-1" />
                  ເວລາເດີນທາງ: ປະມານ 45 ນາທີ
                </div>
              </div>

              {/* เลือกวันที่ */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  📅 ເລືອກວັນທີ່ເດີນທາງ
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableDates.map((dateInfo) => (
                    <button
                      key={dateInfo.date}
                      onClick={() => setSelectedDate(dateInfo.date)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedDate === dateInfo.date
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formatDateLao(dateInfo.date)}
                          </div>
                          <div className={`text-sm ${
                            dateInfo.isToday ? 'text-green-600' :
                            dateInfo.isTomorrow ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            {dateInfo.isToday ? 'ມື້ນີ້' :
                             dateInfo.isTomorrow ? 'ມື້ອື່ນ' :
                             `ອີກ ${dateInfo.daysFromNow} ວັນ`}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          dateInfo.isWeekend ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {dateInfo.dayName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {availableDates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>ບໍ່ມີວັນທີ່ສາມາດຈອງໄດ້ໃນຂະນະນີ້</p>
                  </div>
                )}
              </div>

              {/* เลือกจำนวนตั๋ว */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  👥 ຈຳນວນຜູ້ໂດຍສານ
                </label>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                    disabled={ticketCount <= 1}
                    className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-xl font-bold">−</span>
                  </button>
                  
                  <div className="flex-1 max-w-xs">
                    <input
                      type="number"
                      min={BOOKING_CONSTANTS.MIN_TICKETS}
                      max={BOOKING_CONSTANTS.MAX_TICKETS}
                      value={ticketCount}
                      onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-2xl font-bold py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  
                  <button
                    onClick={() => setTicketCount(Math.min(BOOKING_CONSTANTS.MAX_TICKETS, ticketCount + 1))}
                    disabled={ticketCount >= BOOKING_CONSTANTS.MAX_TICKETS}
                    className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-xl font-bold">+</span>
                  </button>
                </div>
                
                <div className="mt-2 text-sm text-gray-600 text-center">
                  ຈອງໄດ້ {BOOKING_CONSTANTS.MIN_TICKETS}-{BOOKING_CONSTANTS.MAX_TICKETS} ຄົນຕໍ່ຄັ້ງ
                </div>
              </div>

              {/* ปุ่มดำเนินการต่อ */}
              <button
                onClick={handleSubmit}
                disabled={!selectedDate || ticketCount < 1 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>ກຳລັງດຳເນີນການ...</span>
                  </>
                ) : (
                  <>
                    <span>ດຳເນີນການຕໍ່</span>
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
                {/* วันที่เดินทาง */}
                <div className="flex justify-between">
                  <span className="text-gray-600">ວັນທີ່ເດີນທາງ:</span>
                  <span className="font-semibold">
                    {selectedDateInfo ? formatDateLao(selectedDate) : '-'}
                  </span>
                </div>
                
                {/* จำนวนผู้โดยสาร */}
                <div className="flex justify-between">
                  <span className="text-gray-600">ຈຳນວນຜູ້ໂດຍສານ:</span>
                  <span className="font-semibold">{ticketCount} ຄົນ</span>
                </div>
                
                {/* ราคาต่อคน */}
                {pricing && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ລາຄາຕໍ່ຄົນ:</span>
                    <span className="font-semibold">{formatPrice(pricing.pricePerTicket)}</span>
                  </div>
                )}
                
                <hr className="border-gray-200" />
                
                {/* ราคารวม */}
                {pricing && (
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">ລາຄາລວມ:</span>
                    <span className="font-bold text-blue-600">{formatPrice(pricing.totalPrice)}</span>
                  </div>
                )}
              </div>

              {/* ข้อมูลเพิ่มเติม */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">ຂໍ້ກຳນົດສຳຄັນ:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• ຊຳລະເງິນພາຍໃນ 24 ຊົ່ວໂມງ</li>
                      <li>• ຍົກເລີກໄດ້ກ່ອນ Admin ອະນຸມັດ</li>
                      <li>• ຄືນເງິນ 100% ຖ້າຍົກເລີກທັນເວລາ</li>
                    </ul>
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