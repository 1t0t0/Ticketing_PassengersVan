'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Mail,
  Calendar,
  Users,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Download,
  Ticket
} from 'lucide-react';
import { formatTimeRemaining, formatDateLao } from '@/lib/bookingUtils';

interface BookingStatus {
  id: string;
  booking_id: string;
  travel_date: string;
  total_tickets: number;
  total_price: number;
  booker_email: string;
  booker_name?: string;
  passenger_emails: string[];
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  payment_slip?: string;
  expires_at: string;
  time_remaining: number;
  approved_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  admin_notes?: string;
  can_cancel: boolean;
  created_at: string;
}

export default function BookingStatusPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookingStatus();
  }, [params.id]);

  // อัปเดตเวลาที่เหลือทุกนาที
  useEffect(() => {
    const interval = setInterval(() => {
      if (booking && booking.time_remaining > 0) {
        setBooking(prev => prev ? {
          ...prev,
          time_remaining: Math.max(0, prev.time_remaining - 60000)
        } : null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [booking]);

  const fetchBookingStatus = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setRefreshing(!showLoader);

    try {
      const response = await fetch(`/api/bookings/${params.id}?public=true`);
      
      if (!response.ok) {
        throw new Error('ไม่พบข้อมูลการจอง');
      }
      
      const result = await response.json();
      setBooking(result.booking);
      
    } catch (error) {
      console.error('Error fetching booking status:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !booking.can_cancel) return;

    setCancelling(true);

    try {
      const response = await fetch(`/api/bookings/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          cancel_reason: 'ยกเลิกโดยลูกค้า'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการยกเลิก');
      }

      // อัปเดตสถานะ
      setBooking(prev => prev ? { ...prev, status: 'cancelled', can_cancel: false } : null);
      setShowCancelModal(false);
      
      alert('ยกเลิกการจองสำเร็จ เงินจะถูกคืนภายใน 3-5 วันทำการ');

    } catch (error) {
      console.error('Cancel booking error:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิก');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'ລໍຖ້າການອະນຸມັດ',
          description: 'ສະລິບການໂອນເງິນຖືກສົ່ງແລ້ວ ກຳລັງລໍຖ້າພະນັກງານຕະລວດສອບ'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'ອະນຸມັດແລ້ວ',
          description: 'ການຈອງຖືກອະນຸມັດແລ້ວ ຕີ້ໄດ້ຖືກສົ່ງໄປຍັງ Email ແລ້ວ'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'ຍົກເລີກແລ້ວ',
          description: 'ການຈອງຖືກຍົກເລີກ ເງິນຈະຖືກຄືນພາຍໃນ 3-5 ວັນທຳການ'
        };
      case 'expired':
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'ໝົດເວລາແລ້ວ',
          description: 'ການຈອງໝົດເວລາເນື່ອງຈາກບໍ່ໄດ້ຊຳລະເງິນພາຍໃນ 24 ຊົ່ວໂມງ'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'ບໍ່ຮູ້ສະຖານະ',
          description: 'ບໍ່ສາມາດກຳນົດສະຖານະການຈອງໄດ້'
        };
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('lo-LA').format(amount) + ' ₭';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫຼດສະຖານະ...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลการจอง</h1>
          <button
            onClick={() => router.push('/booking')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            กลับหน้าจอง
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(booking.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/booking')}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ສະຖານະການຈອງ</h1>
                <p className="text-gray-600">ເລກຈອງ: {booking.booking_id}</p>
              </div>
            </div>
            
            <button
              onClick={() => fetchBookingStatus(false)}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">ອັບເດດ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* สถานะหลัก */}
        <div className={`mb-8 ${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-2xl p-6`}>
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 ${statusInfo.bgColor} rounded-full flex items-center justify-center`}>
              <statusInfo.icon className={`w-8 h-8 ${statusInfo.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${statusInfo.color}`}>{statusInfo.title}</h2>
              <p className="text-gray-700 mt-1">{statusInfo.description}</p>
              
              {booking.status === 'pending' && booking.time_remaining > 0 && (
                <div className="mt-3 flex items-center space-x-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    ເວລາທີ່ເຫຼືອ: {formatTimeRemaining(booking.time_remaining)}
                  </span>
                </div>
              )}
              
              {booking.approved_at && (
                <div className="mt-2 text-sm text-gray-600">
                  ອະນຸມັດເມື່ອ: {new Date(booking.approved_at).toLocaleString('lo-LA')}
                </div>
              )}
              
              {booking.cancelled_at && (
                <div className="mt-2 text-sm text-gray-600">
                  ຍົກເລີກເມື່ອ: {new Date(booking.cancelled_at).toLocaleString('lo-LA')}
                  {booking.cancel_reason && (
                    <div className="mt-1">ເຫດຜົນ: {booking.cancel_reason}</div>
                  )}
                </div>
              )}
            </div>
            
            {booking.can_cancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                ຍົກເລີກການຈອງ
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* ข้อมูลการจอง */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ข้อมูลการเดินทาง */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                ຂໍ້ມູນການເດີນທາງ
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ວັນທີ່ເດີນທາງ</label>
                  <p className="font-semibold">{formatDateLao(booking.travel_date)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ຈຳນວນຜູ້ໂດຍສານ</label>
                  <p className="font-semibold">{booking.total_tickets} ຄົນ</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ເສັ້ນທາງ</label>
                  <p className="font-semibold">ສະຖານີລົດໄຟ → ຕົວເມືອງ</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ລາຄາລວມ</label>
                  <p className="font-semibold text-blue-600">{formatPrice(booking.total_price)}</p>
                </div>
              </div>
            </div>

            {/* ข้อมูลผู้จอง */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                ຂໍ້ມູນຜູ້ຈອງ ແລະ ຜູ້ໂດຍສານ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ຜູ້ຈອງ</label>
                  <p className="font-semibold">{booking.booker_name || booking.booker_email}</p>
                  {booking.booker_name && (
                    <p className="text-sm text-gray-600">{booking.booker_email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Email ຜູ້ໂດຍສານ</label>
                  <div className="space-y-2">
                    {booking.passenger_emails.map((email, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="flex-1">{email}</span>
                        {booking.status === 'approved' && (
                          <Ticket className="w-4 h-4 text-green-600" title="ຕີ້ຖືກສົ່ງແລ້ວ" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* สลิปการโอนเงิน */}
            {booking.payment_slip && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  ສະລິບການໂອນເງິນ
                </h3>
                
                <div className="text-center">
                  <img
                    src={booking.payment_slip}
                    alt="Payment Slip"
                    className="max-h-96 mx-auto rounded-lg shadow-md border"
                  />
                  <div className="mt-4">
                    <a
                      href={booking.payment_slip}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-4 h-4" />
                      <span>ດາວໂຫຼດຮູບ</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* หมายเหตุจาก Admin */}
            {booking.admin_notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">📝 ຫມາຍເຫດຈາກພະນັກງານ</h3>
                <p className="text-blue-800">{booking.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Timeline และข้อมูลเพิ่มเติม */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🕐 ປະຫວັດການຈອງ</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">ສ້າງການຈອງ</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleString('lo-LA')}
                    </p>
                  </div>
                </div>
                
                {booking.payment_slip && (
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">ອັບໂຫຼດສະລິບ</p>
                      <p className="text-sm text-gray-600">ສຳເລັດແລ້ວ</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    booking.status === 'approved' ? 'bg-green-600' :
                    booking.status === 'cancelled' || booking.status === 'expired' ? 'bg-red-600' :
                    'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.status === 'approved' ? 'ອະນຸມັດແລ້ວ' :
                       booking.status === 'cancelled' ? 'ຍົກເລີກແລ້ວ' :
                       booking.status === 'expired' ? 'ໝົດເວລາແລ້ວ' :
                       'ລໍຖ້າການອະນຸມັດ'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.approved_at ? new Date(booking.approved_at).toLocaleString('lo-LA') :
                       booking.cancelled_at ? new Date(booking.cancelled_at).toLocaleString('lo-LA') :
                       'ຍັງບໍ່ສຳເລັດ'}
                    </p>
                  </div>
                </div>
                
                {booking.status === 'approved' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">ສົ່ງຕີ້ທາງ Email</p>
                      <p className="text-sm text-gray-600">ແຍກສົ່ງແຕ່ລະຄົນແລ້ວ</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ข้อมูลการติดต่อ */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📞 ຕິດຕໍ່ສອບຖາມ</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>support@busticket.la</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 text-blue-600 text-center">📱</span>
                  <span>020 1234 5678</span>
                </div>
                <div className="text-gray-600">
                  ເວລາບໍລິການ: 8:00 - 18:00 ນ. (ຈັນ-ເສົາ)
                </div>
              </div>
            </div>

            {/* คำแนะนำ */}
            {booking.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">✅ ຄຳແນະນຳ</h3>
                
                <div className="space-y-2 text-sm text-green-800">
                  <p>• ກວດສອບ Email ເພື່ອຮັບຕີ້</p>
                  <p>• ເກັບ QR Code ໄວ້ສະແດງຄົນຂັບ</p>
                  <p>• ມາສະຖານີກ່ອນເວລາ 15 ນາທີ</p>
                  <p>• ໃຊ້ QR Code ໄດ້ເຉພາະວັນເດີນທາງ</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal ยกเลิกการจอง */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ຢືນຢັນການຍົກເລີກ</h3>
            
            <p className="text-gray-600 mb-6">
              ທ່ານແນ່ໃຈບໍ່ທີ່ຈະຍົກເລີກການຈອງນີ້? ເງິນຈະຖືກຄືນພາຍໃນ 3-5 ວັນທຳການ
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-xl transition-colors"
              >
                ບໍ່ຍົກເລີກ
              </button>
              
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>ກຳລັງຍົກເລີກ...</span>
                  </>
                ) : (
                  <span>ຢືນຢັນຍົກເລີກ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}