// app/booking/[id]/payment/page.tsx - Updated Layout
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
  Building,
  Copy,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Info,
  Shield,
  Users,
  Calendar,
  MapPin
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
  ticketNumbers: string[];
  expiresAt: string;
  statusLao: string;
  createdAt: string;
  approvedAt?: string;
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
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ดึงข้อมูลการจอง
  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) {
        throw new Error('ບໍ່ພົບຂໍ້ມູນການຈອງ');
      }
      const data = await response.json();
      setBooking(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
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

  // Auto refresh ทุก 30 วินาที สำหรับ pending status
  useEffect(() => {
    if (!autoRefresh || !booking || booking.status !== 'pending') return;

    const interval = setInterval(() => {
      fetchBooking();
    }, 30000);

    return () => clearInterval(interval);
  }, [booking?.status, autoRefresh]);

  // คัดลอกเลขบัญชี
  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText('123-456-789-0');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = '123-456-789-0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBooking();
  };

  // อัปโหลดสลิป
  const handleSlipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      const updateResponse = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentSlip: result.url }),
      });

      if (updateResponse.ok) {
        await fetchBooking();
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

  // ดาวน์โหลดตั๋ว
  const downloadTickets = () => {
    if (!booking || booking.ticketNumbers.length === 0) return;
    
    const ticketContent = `
ປີ້ລົດຕູ້ໂດຍສານ
ລົດໄຟ ລາວ-ຈີນ

การจอง: ${booking.bookingNumber}
ຊື່ຜູ້ໂດຍສານ: ${booking.passengerInfo.name}
ເບີໂທ: ${booking.passengerInfo.phone}

ລາຍລະອຽດການເດີນທາງ:
ຈຸດຂຶ້ນ: ${booking.tripDetails.pickupLocation}
ປາຍທາງ: ${booking.tripDetails.destination}
ວັນທີ: ${new Date(booking.tripDetails.travelDate).toLocaleDateString('lo-LA')}
ເວລາ: ${booking.tripDetails.travelTime}
ຈຳນວນຄົນ: ${booking.tripDetails.passengers}

ເລກທີປີ້:
${booking.ticketNumbers.map((ticket, index) => `${index + 1}. ${ticket}`).join('\n')}

ລາຄາລວມ: ₭${booking.pricing.totalAmount.toLocaleString()}

⚠️ ສຳຄັນ:
- ໂຊວເລກທີປີ້ໃຫ້ຄົນຂັບເບິ່ງ
- ມາຮອດກ່ອນເວລາ 15 ນາທີ
- ບອກຈຸດໝາຍປາຍທາງໃຫ້ຄົນຂັບຟັງ
`;

    const blob = new Blob([ticketContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ປີ້-${booking.bookingNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            onClick={() => router.push('/booking')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center mx-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
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
            <div className="flex items-center">
              <button
                onClick={() => router.push('/booking')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ຊຳລະເງິນ</h1>
                <p className="text-gray-600">ການຈອງເລກທີ: {booking.bookingNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                title="อัปเดตสถานะ"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => router.push(`/booking/status?booking=${booking.bookingNumber}`)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ກວດສອບສະຖານະ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ส่วนซ้าย - ข้อมูลการจอง */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* สถานะ */}
            <div className={`rounded-lg p-6 border-2 ${
              booking.status === 'approved' ? 'bg-green-50 border-green-200' :
              booking.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              booking.status === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {booking.status === 'approved' && <CheckCircle className="h-6 w-6 text-green-600 mr-3" />}
                  {booking.status === 'pending' && <Clock className="h-6 w-6 text-yellow-600 mr-3" />}
                  {booking.status === 'rejected' && <AlertCircle className="h-6 w-6 text-red-600 mr-3" />}
                  {booking.status === 'expired' && <AlertCircle className="h-6 w-6 text-gray-600 mr-3" />}
                  <div>
                    <p className={`text-xl font-bold ${
                      booking.status === 'approved' ? 'text-green-800' :
                      booking.status === 'pending' ? 'text-yellow-800' :
                      booking.status === 'rejected' ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      {booking.statusLao}
                    </p>
                    {booking.status === 'pending' && autoRefresh && (
                      <div className="flex items-center text-xs text-blue-600 mt-1">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        ກຳລັງຕິດຕາມສະຖານະ...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ขั้นตอนการชำระเงิน - แบบ Row แยกออกมา */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold mb-3 flex items-center">
                <Info className="mr-2 text-blue-600 h-4 w-4" />
                ຂັ້ນຕອນການຊຳລະເງິນ
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`flex items-center p-2 rounded-lg flex-1 ${
                  booking.status !== 'pending' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 ${
                    booking.status !== 'pending' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">ໂອນເງິນ</p>
                  </div>
                  {booking.status !== 'pending' && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>

                <div className={`flex items-center p-2 rounded-lg flex-1 ${
                  hasPaymentSlip ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 ${
                    hasPaymentSlip ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">ອັບໂຫລດສລິບ</p>
                  </div>
                  {hasPaymentSlip && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>

                <div className={`flex items-center p-2 rounded-lg flex-1 ${
                  booking.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 ${
                    booking.status === 'approved' ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">ຮັບອະນຸມັດ</p>
                  </div>
                  {booking.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            </div>


            {/* ข้อมูลการเดินทางและผู้ติดต่อ - รวมกัน */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="mr-2 text-blue-600" />
                ຂໍ້ມູນການເດີນທາງ ແລະ ຜູ້ຕິດຕໍ່
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ข้อมูลการเดินทาง */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                    ການເດີນທາງ
                  </h4>
                  <div className="space-y-2">
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

                {/* ข้อมูลผู้ติดต่อ */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-green-500" />
                    ຜູ້ຕິດຕໍ່
                  </h4>
                  <div className="space-y-2">
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">ລາຄາລວມ:</span>
                      <span className="font-bold text-blue-600">₭{booking.pricing.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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

          </div>

          {/* ส่วนขวา - การชำระเงินและข้อมูลการโอน */}
          <div className="space-y-6">
            
            {/* ข้อมูลการโอนเงิน - ย้ายมาด้านบน + เพิ่มปุ่มอัปโหลด */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Building className="mr-2 text-blue-600" />
                ຂໍ້ມູນການໂອນເງິນ
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">ທະນາຄານ:</span>
                      <span className="font-semibold">BCEL One</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-600">ເລກບັນຊີ:</span>
                      <div className="flex items-center">
                        <span className="font-mono font-semibold mr-2">123-456-789-0</span>
                        <button
                          onClick={copyAccountNumber}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                          title="คัดลอกเลขบัญชี"
                        >
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">ຊື່ບັນຊີ:</span>
                      <span className="font-semibold">ບໍລິສັດລົດຕູ້ໂດຍສານ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">ຈຳນວນເງິນ:</span>
                      <span className="font-bold text-blue-600">₭{booking.pricing.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-3">
                    <QrCode className="h-24 w-24 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">QR Code ສຳລັບໂອນເງິນ</p>
                  <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center mx-auto">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    ເປີດແອບທະນາຄານ
                  </button>
                </div>

                {/* คำแนะนำ */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 font-medium mb-2">💡 ຄຳແນະນຳ:</p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• ໂອນເງິນຈຳນວນທີ່ແນ່ນອນ</li>
                    <li>• ບັນທຶກຫລຽງຖ່າຍຮູບສລິບ</li>
                    <li>• ອັບໂຫລດທັນທີຫລັງໂອນເງິນ</li>
                  </ul>
                </div>

                {/* ปุ่มอัปโหลดสลิป - ย้ายมาด้านล่างของข้อมูลการโอน */}
                {booking.status === 'pending' && !isExpired && !hasPaymentSlip && (
                  <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <div className="relative">
                      {uploading ? (
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                          <p className="text-blue-600 font-medium mb-3">ກຳລັງອັບໂຫລດ...</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">{uploadProgress}%</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-700 font-medium mb-2">ອັບໂຫລດສລິບການໂອນເງິນ</p>
                          <p className="text-sm text-gray-500 mb-3">
                            JPG, PNG, WebP (ສູງສຸດ 5MB)
                          </p>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
                            ເລືອກໄຟລ์ສລິບ
                          </button>
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

                {/* แสดงสลิปที่อัปโหลดแล้ว */}
                {booking.status === 'pending' && !isExpired && hasPaymentSlip && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-center">
                      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 font-medium mb-2">ອັບໂຫລດສລິບສຳເລັດ</p>
                      <div className="flex items-center justify-center text-sm text-yellow-600 mb-3">
                        <Clock className="h-4 w-4 mr-1" />
                        ລໍຖ້າການອະນຸມັດ - ເວລາທີ່ເຫຼືອ: <span className="font-mono ml-1 text-red-600">{timeLeft}</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <img 
                          src={booking.paymentSlip} 
                          alt="Payment Slip" 
                          className="w-full h-32 object-contain rounded cursor-pointer"
                          onClick={() => window.open(booking.paymentSlip, '_blank')}
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">ກົດເພື່ອເບິ່ງຂະໜາດເຕັມ</p>
                      </div>
                      <div className="relative">
                        <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                          ອັບໂຫລດໃໝ່
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          

            {/* อัปโหลดสลิป - ลบส่วนนี้ออกเพราะย้ายไปไว้ในข้อมูลการโอนแล้ว */}

            {/* ผลการอนุมัติ */}
            {booking.status === 'approved' && (
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">ອະນຸມັດແລ້ວ! 🎉</h3>
                  <p className="text-green-700 mb-4">ການຈອງຂອງທ່ານໄດ້ຮັບການອະນຸມັດແລ້ວ</p>
                  
                  {booking.ticketNumbers.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-green-600 mb-2">ເລກທີປີ້ຂອງທ່ານ:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {booking.ticketNumbers.map((ticket, index) => (
                          <span key={index} className="bg-white px-3 py-1 rounded-full text-green-800 font-mono font-bold">
                            {ticket}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={downloadTickets}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center mx-auto"
                  >
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
                  <p className="text-red-700 mb-4">ການຈອງຂອງທ່ານຖືກປະຕິເສດ</p>
                  
                  <button
                    onClick={() => router.push('/booking')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ຈອງໃໝ່
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}