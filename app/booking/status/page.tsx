// app/booking/status/page.tsx - Updated with Better Booking Number Display
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Phone,
  Calendar,
  Users,
  MapPin,
  Ticket as TicketIcon,
  Download,
  RefreshCw,
  Copy,
  Check
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

// ✅ Reusable Booking Number Component
function BookingNumberDisplay({ 
  bookingNumber, 
  size = 'md',
  variant = 'card'
}: { 
  bookingNumber: string; 
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'inline';
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = bookingNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    sm: { text: 'text-sm', padding: 'px-2 py-1', icon: 'h-3 w-3' },
    md: { text: 'text-base', padding: 'px-3 py-2', icon: 'h-4 w-4' },
    lg: { text: 'text-lg', padding: 'px-4 py-3', icon: 'h-5 w-5' }
  };

  const variantClasses = {
    default: 'bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300',
    card: 'bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-400',
    inline: 'bg-transparent border border-gray-300 hover:bg-gray-50'
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={`inline-flex items-center ${variantClasses[variant]} rounded-lg ${sizeClass.padding} group transition-colors cursor-pointer`}>
      <span 
        className={`font-mono font-bold ${sizeClass.text} text-blue-700 mr-2 select-all`}
        onClick={handleCopy}
      >
        {bookingNumber}
      </span>
      <button
        onClick={handleCopy}
        className={`${copied ? 'text-green-600' : 'text-gray-400 hover:text-blue-600'} hover:bg-blue-100 rounded p-1 transition-colors`}
        title={copied ? 'ຄັດລອກແລ້ວ!' : 'ຄັດລອກເລກການຈອງ'}
      >
        {copied ? <Check className={sizeClass.icon} /> : <Copy className={sizeClass.icon} />}
      </button>
    </div>
  );
}

export default function BookingStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBooking = searchParams.get('booking') || '';

  const [searchQuery, setSearchQuery] = useState(initialBooking);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ค้นหาการจอง
  const searchBooking = async (query: string) => {
    if (!query.trim()) {
      setError('ກະລຸນາໃສ່ເລກທີການຈອງ ຫຼື ເບີໂທ');
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const response = await fetch(`/api/bookings/status?query=${encodeURIComponent(query.trim())}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('ບໍ່ພົບຂໍ້ມູນການຈອງ');
        }
        throw new Error('ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາ');
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setBooking(data[0]);
      } else if (data._id) {
        setBooking(data);
      } else {
        throw new Error('ບໍ່ພົບຂໍ້ມູນການຈອງ');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ເກີດຂໍ້ຜິດພາດ');
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาอัตโนมัติหากมี query parameter
  useEffect(() => {
    if (initialBooking) {
      searchBooking(initialBooking);
    }
  }, [initialBooking]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchBooking(searchQuery);
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

  // กลับไปจอง
  const handleNewBooking = () => {
    router.push('/booking');
  };

  // StatusIcon component
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-8 w-8 text-gray-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ກວດສອບສະຖານະການຈອງ</h1>
              <p className="text-gray-600">ຄົ້ນຫາດ້ວຍເລກທີການຈອງ ຫຼື ເບີໂທ</p>
            </div>
            <button
              onClick={handleNewBooking}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ຈອງໃໝ່
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ฟอร์มค้นหา */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ໃສ່ເລກທີການຈອງ (B240612001) ຫຼື ເບີໂທ (020 1234 5678)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="ml-2">{loading ? 'ກຳລັງຄົ້ນຫາ...' : 'ຄົ້ນຫາ'}</span>
            </button>
          </form>
        </div>

        {/* ข้อความแสดงผลลัพธ์ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* ผลลัพธ์การค้นหา */}
        {booking && (
          <div className="space-y-6">
            {/* สถานะการจอง - ✅ ปรับปรุงการแสดง Booking Number */}
            <div className={`rounded-lg p-6 border-2 ${
              booking.status === 'approved' ? 'bg-green-50 border-green-200' :
              booking.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              booking.status === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <StatusIcon status={booking.status} />
                  <div className="ml-4">
                    <h2 className={`text-xl font-bold ${
                      booking.status === 'approved' ? 'text-green-800' :
                      booking.status === 'pending' ? 'text-yellow-800' :
                      booking.status === 'rejected' ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      {booking.statusLao}
                    </h2>
                    {/* ✅ แสดง Booking Number แบบใหม่ */}
                    <div className="flex items-center mt-2">
                      <span className="text-gray-600 text-sm mr-2">ການຈອງເລກທີ:</span>
                      <BookingNumberDisplay 
                        bookingNumber={booking.bookingNumber} 
                        size="md"
                        variant="card"
                      />
                    </div>
                  </div>
                </div>
                
                {booking.status === 'approved' && (
                  <button
                    onClick={downloadTickets}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ດາວໂຫລດປີ້
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ข้อมูลการเดินทาง */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="mr-2 text-blue-600" />
                  ຂໍ້ມູນການເດີນທາງ
                </h3>
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
                    <span className="font-medium flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {new Date(booking.tripDetails.travelDate).toLocaleDateString('lo-LA')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ເວລາ:</span>
                    <span className="font-medium">{booking.tripDetails.travelTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ຈຳນວນຄົນ:</span>
                    <span className="font-medium flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {booking.tripDetails.passengers} ຄົນ
                    </span>
                  </div>
                </div>
              </div>

              {/* ข้อมูลผู้ติดต่อ */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Phone className="mr-2 text-green-600" />
                  ຂໍ້ມູນຜູ້ຕິດຕໍ່
                </h3>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">ລາຄາລວມ:</span>
                    <span className="font-bold text-blue-600">₭{booking.pricing.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ตั๋วที่ได้รับอนุมัติ */}
            {booking.status === 'approved' && booking.ticketNumbers.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TicketIcon className="mr-2 text-purple-600" />
                  ເລກທີປີ້ທີ່ໄດ້ຮັບ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {booking.ticketNumbers.map((ticketNumber, index) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center group hover:from-blue-100 hover:to-purple-100 transition-colors"
                    >
                      {/* ✅ ทำให้เลขตั๋วคัดลอกได้ด้วย */}
                      <BookingNumberDisplay 
                        bookingNumber={ticketNumber}
                        size="sm"
                        variant="inline"
                      />
                      <div className="text-sm text-gray-600 mt-1">ປີ້ທີ {index + 1}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>📋 ຄຳແນະນຳ:</strong>
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• ໂຊວເລກທີປີ້ເຫຼົ່ານີ້ໃຫ້ຄົນຂັບເບິ່ງ</li>
                    <li>• ມາຮອດຈຸດນັດພົບກ່ອນເວລາ 15 ນາທີ</li>
                    <li>• ບອກຈຸດໝາຍປາຍທາງໃຫ້ຄົນຂັບຟັງ</li>
                    <li>• ຮັກສາເລກທີປີ້ໄວ້ໃຫ້ດີ</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ประวัติเวลา */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">ປະຫວັດການດຳເນີນການ</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ວັນທີຈອງ:</span>
                  <span className="text-sm">
                    {new Date(booking.createdAt).toLocaleString('lo-LA')}
                  </span>
                </div>
                {booking.approvedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ວັນທີອະນຸມັດ:</span>
                    <span className="text-sm">
                      {new Date(booking.approvedAt).toLocaleString('lo-LA')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ໝົດອາຍຸ:</span>
                  <span className="text-sm">
                    {new Date(booking.expiresAt).toLocaleString('lo-LA')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* คำแนะนำเมื่อไม่มีผลลัพธ์ */}
        {!booking && !loading && !error && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ຄົ້ນຫາການຈອງຂອງທ່ານ</h3>
            <p className="text-gray-600 mb-6">ໃສ່ເລກທີການຈອງ ຫຼື ເບີໂທທີ່ໃຊ້ຈອງ</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>ຕົວຢ່າງ:</strong><br/>
                • ເລກທີການຈອງ: B240612001<br/>
                • ເບີໂທ: 020 1234 5678
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}