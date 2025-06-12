// app/dashboard/bookings/page.tsx - หน้าจัดการการจองสำหรับ Admin
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
  Filter,
  Search,
  Calendar,
  Users,
  MapPin,
  Phone,
  Download,
  RefreshCw
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
  statusLao: string;
  ticketNumbers: string[];
  expiresAt: string;
  createdAt: string;
  approvedAt?: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'expired';

export default function BookingsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // ดึงข้อมูลการจอง
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role && ['admin', 'staff'].includes(session.user.role)) {
      fetchBookings();
    }
  }, [session]);

  // Filter และ Search
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSearch = !searchQuery || 
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.passengerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.passengerInfo.phone.includes(searchQuery);
    
    return matchesStatus && matchesSearch;
  });

  // เปิด modal อนุมัติ
  const openApprovalModal = (booking: BookingData, action: 'approve' | 'reject') => {
    setSelectedBooking(booking);
    setApprovalAction(action);
    setAdminNotes('');
    setShowApprovalModal(true);
  };

  // ปิด modal
  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedBooking(null);
    setAdminNotes('');
  };

  // ดำเนินการอนุมัติ/ปฏิเสธ
  const handleApproval = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(selectedBooking._id);
      
      const response = await fetch(`/api/bookings/${selectedBooking._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalAction,
          adminNotes: adminNotes.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'การดำเนินการล้มเหลว');
      }

      const result = await response.json();
      
      // อัพเดทรายการ
      await fetchBookings();
      
      // แสดงข้อความสำเร็จ
      alert(result.message || `${approvalAction === 'approve' ? 'ອະນຸມັດ' : 'ປະຕິເສດ'}ສຳເລັດ`);
      
      closeApprovalModal();

    } catch (error) {
      console.error('Approval error:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setProcessing(null);
    }
  };

  // StatusBadge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', text: 'ລໍຖ້າອະນຸມັດ' },
      approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: 'ອະນຸມັດແລ້ວ' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', text: 'ປະຕິເສດ' },
      expired: { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', text: 'ໝົດອາຍຸ' }
    };

    const { icon: Icon, color, text } = config[status as keyof typeof config] || config.expired;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </span>
    );
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || !['admin', 'staff'].includes(session.user?.role || '')) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ຈັດການການຈອງ</h1>
            <p className="text-gray-600">ອະນຸມັດ ຫຼື ປະຕິເສດການຈອງປີ້</p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            ອັບເດດ
          </button>
        </div>
      </div>

      {/* Filters และ Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ທັງໝົດ</option>
              <option value="pending">ລໍຖ້າອະນຸມັດ</option>
              <option value="approved">ອະນຸມັດແລ້ວ</option>
              <option value="rejected">ປະຕິເສດ</option>
              <option value="expired">ໝົດອາຍຸ</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາດ້ວຍເລກທີການຈອງ, ຊື່, ຫຼື ເບີໂທ"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['pending', 'approved', 'rejected', 'expired'] as const).map(status => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === status).length}
              </div>
              <div className="text-sm text-gray-500">
                {status === 'pending' ? 'ລໍຖ້າອະນຸມັດ' :
                 status === 'approved' ? 'ອະນຸມັດແລ້ວ' :
                 status === 'rejected' ? 'ປະຕິເສດ' : 'ໝົດອາຍຸ'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ບໍ່ມີຂໍ້ມູນ</h3>
          <p className="text-gray-600">ບໍ່ພົບການຈອງທີ່ຕົງກັບເງື່ອນໄຂ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.bookingNumber}
                      </h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ສ້າງເມື່ອ: {new Date(booking.createdAt).toLocaleString('lo-LA')}
                    </p>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openApprovalModal(booking, 'approve')}
                        disabled={processing === booking._id}
                        className="flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        ອະນຸມັດ
                      </button>
                      <button
                        onClick={() => openApprovalModal(booking, 'reject')}
                        disabled={processing === booking._id}
                        className="flex items-center px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        ປະຕິເສດ
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ข้อมูลผู้โดยสาร */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-blue-600" />
                      ຜູ້ຕິດຕໍ່
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{booking.passengerInfo.name}</p>
                      <p>{booking.passengerInfo.phone}</p>
                      {booking.passengerInfo.email && <p>{booking.passengerInfo.email}</p>}
                    </div>
                  </div>

                  {/* ข้อมูลการเดินทาง */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-green-600" />
                      ການເດີນທາງ
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{booking.tripDetails.pickupLocation} → {booking.tripDetails.destination}</p>
                      <p className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(booking.tripDetails.travelDate).toLocaleDateString('lo-LA')}
                      </p>
                      <p>ເວລາ: {booking.tripDetails.travelTime}</p>
                      <p className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {booking.tripDetails.passengers} ຄົນ
                      </p>
                    </div>
                  </div>

                  {/* ข้อมูลการชำระเงิน */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ການຊຳລະເງິນ</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>ລາຄາລວມ: <span className="font-medium text-blue-600">₭{booking.pricing.totalAmount.toLocaleString()}</span></p>
                      <div className="flex items-center space-x-2">
                        <span>ສລິບ:</span>
                        {booking.paymentSlip ? (
                          <button
                            onClick={() => window.open(booking.paymentSlip, '_blank')}
                            className="text-blue-600 hover:text-blue-800 underline flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            ເບິ່ງສລິບ
                          </button>
                        ) : (
                          <span className="text-orange-600">ຍັງບໍ່ອັບໂຫລດ</span>
                        )}
                      </div>
                      {booking.status === 'approved' && booking.ticketNumbers.length > 0 && (
                        <div>
                          <p className="text-green-600 font-medium">ປີ້ທີ່ອອກໃຫ້:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {booking.ticketNumbers.map((ticket, index) => (
                              <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {ticket}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* เวลาหมดอายุ (สำหรับ pending) */}
                {booking.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <Clock className="w-4 h-4 inline mr-1" />
                      ໝົດອາຍຸ: {new Date(booking.expiresAt).toLocaleString('lo-LA')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                  {approvalAction === 'approve' ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <X className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {approvalAction === 'approve' ? 'ອະນຸມັດການຈອງ' : 'ປະຕິເສດການຈອງ'}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      ເລກທີການຈອງ: {selectedBooking.bookingNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      ຜູ້ຈອງ: {selectedBooking.passengerInfo.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Slip Preview */}
              {selectedBooking.paymentSlip && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">ສລິບການໂອນເງິນ:</p>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={selectedBooking.paymentSlip} 
                      alt="Payment Slip" 
                      className="w-full h-48 object-contain bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ໝາຍເຫດ {approvalAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={approvalAction === 'approve' ? 'ໝາຍເຫດເພີ່ມເຕີມ (ບໍ່ບັງຄັບ)' : 'ເຫດຜົນໃນການປະຕິເສດ'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required={approvalAction === 'reject'}
                />
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleApproval}
                  disabled={processing === selectedBooking._id || (approvalAction === 'reject' && !adminNotes.trim())}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    approvalAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {processing === selectedBooking._id ? (
                    <div className="flex items-center">
                      <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      ກຳລັງດຳເນີນການ...
                    </div>
                  ) : (
                    approvalAction === 'approve' ? 'ອະນຸມັດ' : 'ປະຕິເສດ'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeApprovalModal}
                  disabled={processing === selectedBooking._id}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
                >
                  ຍົກເລີກ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}