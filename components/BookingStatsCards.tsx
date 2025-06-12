// components/BookingStatsCards.tsx - Dashboard Booking Statistics Component
'use client';

import { 
  FiCalendar, 
  FiCheckCircle, 
  FiClock, 
  FiXCircle, 
  FiAlertCircle,
  FiTrendingUp,
  FiDollarSign,
  FiUsers
} from 'react-icons/fi';

interface BookingStats {
  totalBookings: number;
  totalBookingRevenue: number;
  approvedBookingRevenue: number;
  bookingsByStatus: {
    pending: { count: number; revenue: number };
    approved: { count: number; revenue: number };
    rejected: { count: number; revenue: number };
    expired: { count: number; revenue: number };
  };
  revenueBreakdown: {
    walkIn: { tickets: number; revenue: number; percentage: number };
    booking: { tickets: number; revenue: number; percentage: number };
  };
  conversionRate: number;
  avgBookingValue: number;
}

interface BookingStatsCardsProps {
  bookingStats: BookingStats;
  isLoading?: boolean;
}

export default function BookingStatsCards({ bookingStats, isLoading }: BookingStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `₭${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Booking Overview Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiCalendar className="mr-2 text-blue-600" />
          ສະຖິຕິລະບົບຈອງປີ້
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Bookings */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FiCalendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">ການຈອງທັງໝົດ</p>
                <p className="text-2xl font-bold text-blue-900">{bookingStats.totalBookings}</p>
              </div>
            </div>
          </div>

          {/* Pending Bookings */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <FiClock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">ລໍຖ້າອະນຸມັດ</p>
                <p className="text-2xl font-bold text-yellow-900">{bookingStats.bookingsByStatus.pending.count}</p>
              </div>
            </div>
          </div>

          {/* Approved Bookings */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">ອະນຸມັດແລ້ວ</p>
                <p className="text-2xl font-bold text-green-900">{bookingStats.bookingsByStatus.approved.count}</p>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <FiTrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">ອັດຕາສຳເລັດ</p>
                <p className="text-2xl font-bold text-purple-900">{bookingStats.conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiDollarSign className="mr-2 text-green-600" />
          ການແບ່ງລາຍຮັບຕາມປະເພດ
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Walk-in Revenue */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiUsers className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Walk-in</p>
                  <p className="text-xs text-gray-500">{bookingStats.revenueBreakdown.walkIn.tickets} ໃບ</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(bookingStats.revenueBreakdown.walkIn.revenue)}
                </p>
                <p className="text-sm text-orange-600 font-medium">
                  {bookingStats.revenueBreakdown.walkIn.percentage}%
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${bookingStats.revenueBreakdown.walkIn.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Booking Revenue */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiCalendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Booking</p>
                  <p className="text-xs text-gray-500">{bookingStats.revenueBreakdown.booking.tickets} ໃບ</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(bookingStats.revenueBreakdown.booking.revenue)}
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  {bookingStats.revenueBreakdown.booking.percentage}%
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${bookingStats.revenueBreakdown.booking.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Average Booking Value */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiDollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">ມູນຄ່າເຉລ່ຍ</p>
                  <p className="text-xs text-gray-500">ຕໍ່ການຈອງ</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(bookingStats.avgBookingValue)}
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {bookingStats.bookingsByStatus.approved.count} ຈອງ
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700">
                  ລາຍຮັບລວມ: {formatCurrency(bookingStats.approvedBookingRevenue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ສະຖານະການຈອງ</h3>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Pending */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <FiClock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-800">ລໍຖ້າອະນຸມັດ</p>
              <p className="text-xl font-bold text-yellow-900">{bookingStats.bookingsByStatus.pending.count}</p>
              <p className="text-xs text-yellow-600 mt-1">
                {formatCurrency(bookingStats.bookingsByStatus.pending.revenue)}
              </p>
            </div>

            {/* Approved */}
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <FiCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">ອະນຸມັດແລ້ວ</p>
              <p className="text-xl font-bold text-green-900">{bookingStats.bookingsByStatus.approved.count}</p>
              <p className="text-xs text-green-600 mt-1">
                {formatCurrency(bookingStats.bookingsByStatus.approved.revenue)}
              </p>
            </div>

            {/* Rejected */}
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
              <FiXCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-800">ປະຕິເສດ</p>
              <p className="text-xl font-bold text-red-900">{bookingStats.bookingsByStatus.rejected.count}</p>
              <p className="text-xs text-red-600 mt-1">
                {formatCurrency(bookingStats.bookingsByStatus.rejected.revenue)}
              </p>
            </div>

            {/* Expired */}
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <FiAlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800">ໝົດອາຍຸ</p>
              <p className="text-xl font-bold text-gray-900">{bookingStats.bookingsByStatus.expired.count}</p>
              <p className="text-xs text-gray-600 mt-1">
                {formatCurrency(bookingStats.bookingsByStatus.expired.revenue)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}