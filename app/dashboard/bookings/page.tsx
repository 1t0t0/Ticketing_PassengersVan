// app/dashboard/bookings/page.tsx - Fixed undefined property access
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Users,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
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
  approvedBy?: {
    name: string;
    email: string;
    employeeId: string;
  };
  adminNotes?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function AdminBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // ดึงข้อมูลการจอง
  const fetchBookings = async (page = 1, search = searchTerm, status = statusFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: status
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/bookings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      
      // ✅ เพิ่มการตรวจสอบและ validation ข้อมูล
      const validBookings = (data.bookings || []).map((booking: any) => ({
        ...booking,
        // ป้องกัน undefined errors
        passengerInfo: booking.passengerInfo || { name: 'N/A', phone: 'N/A' },
        tripDetails: booking.tripDetails || { 
          pickupLocation: 'N/A', 
          destination: 'N/A', 
          travelDate: new Date().toISOString(), 
          travelTime: '08:00', 
          passengers: 1 
        },
        pricing: booking.pricing || { basePrice: 0, totalAmount: 0 },
        ticketNumbers: booking.ticketNumbers || [],
        approvedBy: booking.approvedBy || null
      }));

      setBookings(validBookings);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
      setBookings([]); // ✅ ตั้งค่าเป็น empty array เมื่อ error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ค้นหา
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchBookings(1, searchTerm, statusFilter);
  };

  // กด Enter ใน search box
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // เปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    fetchBookings(page, searchTerm, statusFilter);
  };

  // เปิด Modal สำหรับดูรายละเอียด
  const openModal = (booking: BookingData) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.adminNotes || '');
    setShowModal(true);
  };

  // อนุมัติ/ปฏิเสธการจอง
  const handleBookingAction = async (action: 'approve' | 'reject') => {
    if (!selectedBooking) return;

    // ตรวจสอบก่อนอนุมัติ
    if (action === 'approve' && !selectedBooking.paymentSlip) {
      alert('ບໍ່ສາມາດອະນຸມັດໄດ້ ເນື່ອງຈາກຍັງບໍ່ມີສລິບການໂອນເງິນ');
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/bookings/${selectedBooking._id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes: adminNotes.trim() || undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || (action === 'approve' ? 'ອະນຸມັດສຳເລັດ!' : 'ປະຕິເສດສຳເລັດ!'));
        setShowModal(false);
        fetchBookings(pagination.currentPage, searchTerm, statusFilter); // รีเฟรชข้อมูล
      } else {
        alert(result.error || 'ເກີດຂໍ້ຜິດພາດ');
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່');
    } finally {
      setActionLoading(false);
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
      expired: <AlertCircle className="w-3 h-3" />
    };

    const labels = {
      pending: 'ລໍຖ້າອະນຸມັດ',
      approved: 'ອະນຸມັດແລ້ວ',
      rejected: 'ປະຕິເສດ',
      expired: 'ໝົດອາຍຸ'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.expired}`}>
        {icons[status as keyof typeof icons] || icons.expired}
        <span className="ml-1">{labels[status as keyof typeof labels] || status}</span>
      </span>
    );
  };

  // ✅ Safe date formatting function
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('lo-LA');
    } catch {
      return 'Invalid Date';
    }
  };

  // ✅ Safe number formatting function
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toLocaleString();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ຈັດການການຈອງ</h1>
            <p className="text-gray-600">ອະນຸມັດ ແລະ ຈັດການການຈອງປີ້ລ່ວງໜ້າ</p>
          </div>
          <button
            onClick={() => fetchBookings(pagination.currentPage, searchTerm, statusFilter)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            ໂຫລດໃໝ່
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ຄົ້ນຫາ
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="ຄົ້ນຫາດ້ວຍເລກການຈອງ, ຊື່, ຫຼື ເບີໂທ..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ສະຖານະ
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ທັງໝົດ</option>
              <option value="pending">ລໍຖ້າອະນຸມັດ</option>
              <option value="approved">ອະນຸມັດແລ້ວ</option>
              <option value="rejected">ປະຕິເສດ</option>
              <option value="expired">ໝົດອາຍຸ</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ຄົ້ນຫາ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ລໍຖ້າອະນຸມັດ</p>
              <p className="text-lg font-semibold text-gray-900">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ອະນຸມັດແລ້ວ</p>
              <p className="text-lg font-semibold text-gray-900">
                {bookings.filter(b => b.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ປະຕິເສດ</p>
              <p className="text-lg font-semibold text-gray-900">
                {bookings.filter(b => b.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">ທັງໝົດ</p>
              <p className="text-lg font-semibold text-gray-900">
                {pagination.totalCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ການຈອງ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ຜູ້ໂດຍສານ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ການເດີນທາງ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ລາຄາ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ສະຖານະ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ວັນທີສ້າງ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ການດຳເນີນການ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">ກຳລັງໂຫລດ...</p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">ບໍ່ມີການຈອງ</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.bookingNumber || 'N/A'}
                        </div>
                        {booking.paymentSlip && (
                          <div className="text-xs text-green-600 flex items-center mt-1">
                            <CreditCard className="w-3 h-3 mr-1" />
                            ມີສລິບ
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.passengerInfo?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {booking.passengerInfo?.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(booking.tripDetails?.travelDate)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {booking.tripDetails?.passengers || 0} ຄົນ
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₭{formatNumber(booking.pricing?.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status || 'pending'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(booking)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && bookings.length > 0 && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ກ່ອນໜ້າ
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ຕໍ່ໄປ
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    ສະແດງ <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> ຫາ{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                    </span>{' '}
                    ຈາກ <span className="font-medium">{pagination.totalCount}</span> ລາຍການ
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const page = index + 1;
                      const isCurrentPage = page === pagination.currentPage;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    ລາຍລະອຽດການຈອງ: {selectedBooking.bookingNumber || 'N/A'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ข้อมูลผู้โดยสาร */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">ຂໍ້ມູນຜູ້ໂດຍສານ</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div><span className="font-medium">ຊື່:</span> {selectedBooking.passengerInfo?.name || 'N/A'}</div>
                        <div><span className="font-medium">ເບີໂທ:</span> {selectedBooking.passengerInfo?.phone || 'N/A'}</div>
                        {selectedBooking.passengerInfo?.email && (
                          <div><span className="font-medium">ອີເມວ:</span> {selectedBooking.passengerInfo.email}</div>
                        )}
                      </div>
                    </div>

                    <h4 className="font-medium text-gray-900">ຂໍ້ມູນການເດີນທາງ</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div><span className="font-medium">ວັນທີ:</span> {formatDate(selectedBooking.tripDetails?.travelDate)}</div>
                        <div><span className="font-medium">ເວລາ:</span> {selectedBooking.tripDetails?.travelTime || 'N/A'}</div>
                        <div><span className="font-medium">ຈຳນວນຄົນ:</span> {selectedBooking.tripDetails?.passengers || 0} ຄົນ</div>
                        <div><span className="font-medium">ລາຄາລວມ:</span> ₭{formatNumber(selectedBooking.pricing?.totalAmount)}</div>
                      </div>
                    </div>
                  </div>

                  {/* สถานะและการชำระเงิน */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">ສະຖານະ ແລະ ການຊຳລະເງິນ</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">ສະຖານະ:</span>
                          <div className="mt-1">
                            <StatusBadge status={selectedBooking.status || 'pending'} />
                          </div>
                        </div>
                        <div><span className="font-medium">ວັນທີສ້າງ:</span> {formatDate(selectedBooking.createdAt)}</div>
                        <div><span className="font-medium">ໝົດອາຍຸ:</span> {formatDate(selectedBooking.expiresAt)}</div>
                        {selectedBooking.approvedAt && (
                          <div><span className="font-medium">ວັນທີອະນຸມັດ:</span> {formatDate(selectedBooking.approvedAt)}</div>
                        )}
                      </div>
                    </div>

                    {selectedBooking.paymentSlip && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">ສລິບການໂອນເງິນ</h4>
                        <div className="border border-gray-300 rounded-lg p-2">
                          <img 
                            src={selectedBooking.paymentSlip} 
                            alt="Payment Slip" 
                            className="w-full h-48 object-cover rounded cursor-pointer"
                            onClick={() => window.open(selectedBooking.paymentSlip, '_blank')}
                          />
                        </div>
                      </div>
                    )}

                    {selectedBooking.ticketNumbers && selectedBooking.ticketNumbers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">ເລກທີປີ້</h4>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            {selectedBooking.ticketNumbers.map((ticket, index) => (
                              <div key={index} className="bg-white p-2 rounded border text-center font-mono">
                                {ticket}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedBooking.status === 'pending' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ໝາຍເຫດຈາກ Admin (ຖ້າມີ)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ໃສ່ໝາຍເຫດສຳລັບການອະນຸມັດ/ປະຕິເສດ..."
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleBookingAction('approve')}
                      disabled={actionLoading || !selectedBooking.paymentSlip}
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                        selectedBooking.paymentSlip && !actionLoading
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {actionLoading ? 'ກຳລັງປະມວນຜົນ...' : 'ອະນຸມັດ'}
                    </button>
                    <button
                      onClick={() => handleBookingAction('reject')}
                      disabled={actionLoading}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'ກຳລັງປະມວນຜົນ...' : 'ປະຕິເສດ'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  ປິດ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}