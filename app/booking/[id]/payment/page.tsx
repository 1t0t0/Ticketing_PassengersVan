// app/booking/[id]/payment/page.tsx - หน้าชำระเงินและอัปโหลดสลิป
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Upload, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  QrCode,
  Phone,
  Building
} from 'lucide-react';

interface BookingData {
  _id: string;
  bookingNumber: string;
  passengerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  tripDetails: {
    pickupLocation: string;
    destination: string;
    travelDate: string;
    travelTime: string;
    passengers: number;
  };
  pricing: {
    basePrice: number;
    totalAmount: number;
  };
  paymentSlip?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: string;
  statusLao: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // ดึงข้อมูลการจอง
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('ບໍ່ພົບຂໍ້ມູນການຈອງ');
        }
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'ເກີດຂໍ້ຜິດພາດ');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // นับถอยหลังเวลาที่เหลือ
  useEffect(() => {
    if (!booking?.expiresAt) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(booking.expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('ໝົດອາຍຸແລ້ວ');
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  // อัปโหลดสลิป
  const handleSlipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบไฟล์
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('ຂະໜາດໄຟລ์ໃຫຍ່ເກີນໄປ (ບໍ່ເກີນ 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('ປະເພດໄຟລ์ບໍ່ຖືກຕ້ອງ (JPG, PNG, WebP ເທົ່ານັ້ນ)');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('slip', file);
      formData.append('bookingId', bookingId);

      // จำลอง progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload-slip', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ອັບໂຫລດລົ້ມເຫຼວ');
      }

      const result = await response.json();

      // อัพเดทการจองด้วย URL ของสลิป
      const updateResponse = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentSlip: result.url }),
      });

      if (updateResponse.ok) {
        // รีเฟรชข้อมูลการจอง
        const updatedBooking = await updateResponse.json();
        setBooking(updatedBooking);
        alert('ອັບໂຫລດສລິບສຳເລັດ! ລໍຖ້າການອະນຸມັດຈາກພະນັກງານ');
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫລດ');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // กลับไปหน้าจอง
  const handleBackToBooking = () => {
    router.push('/booking');
  };

  // ตรวจสอบสถานะ
  const handleCheckStatus = () => {
    router.push(`/booking/status?booking=${booking?.bookingNumber}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ເກີດຂໍ້ຜິດພາດ</h1>
          <p className="text-gray-600 mb-6">{error || 'ບໍ່ພົບຂໍ້ມູນການຈອງ'}</p>
          <button
            onClick={handleBackToBooking}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            ກັບໄປໜ້າຈອງ
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > new Date(booking.expiresAt);
  const hasPaymentSlip = !!booking.paymentSlip;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ຊຳລະເງິນ</h1>
              <p className="text-gray-600">ການຈອງເລກທີ: {booking.bookingNumber}</p>
            </div>
            <button
              onClick={handleCheckStatus}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ກວດສອບສະຖານະ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ข้อมูลการจอง */}
          <div className="lg:col-span-2">
            {/* สถานะและเวลาที่เหลือ */}
            <div className={`rounded-lg p-6 mb-6 ${
              booking.status === 'approved' ? 'bg-green-50 border border-green-200' :
              booking.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
              booking.status === 'rejected' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {booking.status === 'approved' && <CheckCircle className="h-6 w-6 text-green-600 mr-2" />}
                  {booking.status === 'pending' && <Clock className="h-6 w-6 text-yellow-600 mr-2" />}
                  {booking.status === 'rejected' && <AlertCircle className="h-6 w-6 text-red-600 mr-2" />}
                  {booking.status === 'expired' && <AlertCircle className="h-6 w-6 text-gray-600 mr-2" />}
                  <div>
                    <p className={`font-semibold ${
                      booking.status === 'approved' ? 'text-green-800' :
                      booking.status === 'pending' ? 'text-yellow-800' :
                      booking.status === 'rejected' ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      {booking.statusLao}
                    </p>
                    {booking.status === 'pending' && !isExpired && (
                      <p className="text-sm text-gray-600">ເວລາທີ່ເຫຼືອ: {timeLeft}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลการเดินทาง */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">ຂໍ້ມູນການເດີນທາງ</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ຈຸດຂຶ້ນ:</span>
                  <span className="font-medium">{booking.tripDetails.pickupLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ປາຍທາງ:</span>
                  <span className="font-medium">{booking.tripDetails.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ວັນທີ:</span>
                  <span className="font-medium">
                    {new Date(booking.tripDetails.travelDate).toLocaleDateString('lo-LA')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ເວລາ:</span>
                  <span className="font-medium">{booking.tripDetails.travelTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ຈຳນວນຄົນ:</span>
                  <span className="font-medium">{booking.tripDetails.passengers} ຄົນ</span>
                </div>
              </div>
            </div>

            {/* ข้อมูลผู้โดยสาร */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">ຂໍ້ມູນຜູ້ຕິດຕໍ່</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ຊື່:</span>
                  <span className="font-medium">{booking.passengerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ເບີໂທ:</span>
                  <span className="font-medium">{booking.passengerInfo.phone}</span>
                </div>
                {booking.passengerInfo.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ອີເມວ:</span>
                    <span className="font-medium">{booking.passengerInfo.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ส่วนชำระเงิน */}
          <div className="space-y-6">
            {/* สรุปการชำระเงิน */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">ສະຫຼຸບການຊຳລະ</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>ລາຄາຕໍ່ຄົນ:</span>
                  <span>₭{booking.pricing.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>ຈຳນວນ:</span>
                  <span>{booking.tripDetails.passengers} ຄົນ</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>ລວມທັງໝົດ:</span>
                  <span className="text-blue-600">₭{booking.pricing.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ข้อมูลการโอนเงิน */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Building className="mr-2 text-blue-600" />
                ຂໍ້ມູນການໂອນເງິນ
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">ທະນາຄານ:</span>
                  <span className="ml-2">BCEL One</span>
                </div>
                <div>
                  <span className="font-medium">ເລກບັນຊີ:</span>
                  <span className="ml-2 font-mono">123-456-789-0</span>
                </div>
                <div>
                  <span className="font-medium">ຊື່ບັນຊີ:</span>
                  <span className="ml-2">ບໍລິສັດລົດຕູ້ໂດຍສານ</span>
                </div>
                <div className="bg-white p-3 rounded mt-4">
                  <div className="flex items-center justify-center">
                    <QrCode className="h-24 w-24 text-gray-400" />
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-2">QR Code ສຳລັບໂອນເງິນ</p>
                </div>
              </div>
            </div>

            {/* อัปโหลดสลิป */}
            {booking.status === 'pending' && !isExpired && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">ອັບໂຫລດສລິບການໂອນ</h3>
                
                {hasPaymentSlip ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-600 font-medium mb-2">ອັບໂຫລດສຳເລັດແລ້ວ</p>
                    <p className="text-sm text-gray-600 mb-4">ລໍຖ້າການອະນຸມັດຈາກພະນັກງານ</p>
                    <img 
                      src={booking.paymentSlip} 
                      alt="Payment Slip" 
                      className="max-w-full h-48 object-contain mx-auto rounded border"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {uploading ? (
                        <div>
                          <Upload className="h-12 w-12 text-blue-500 mx-auto mb-3 animate-pulse" />
                          <p className="text-blue-600 font-medium mb-2">ກຳລັງອັບໂຫລດ...</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">{uploadProgress}%</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 mb-2">ກົດເພື່ອເລືອກສລິບ</p>
                          <p className="text-xs text-gray-500">รองรับ JPG, PNG, WebP (ไม่เกิน 5MB)</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSlipUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ผลการอนุมัติ */}
            {booking.status === 'approved' && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">ອະນຸມັດແລ້ວ!</h3>
                  <p className="text-green-700 mb-4">ການຈອງຂອງທ່ານໄດ້ຮັບການອະນຸມັດແລ້ວ</p>
                  <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center mx-auto">
                    <Download className="mr-2 h-4 w-4" />
                    ດາວໂຫລດປີ້
                  </button>
                </div>
              </div>
            )}

            {booking.status === 'rejected' && (
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800 mb-2">ປະຕິເສດ</h3>
                  <p className="text-red-700">ການຈອງຂອງທ່ານຖືກປະຕິເສດ</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}