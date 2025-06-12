// app/dashboard/page.tsx - Updated with Booking Integration
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  FiDollarSign, 
  FiUsers, 
  FiRefreshCw,
  FiCalendar,
  FiTrendingUp,
  FiCheckCircle
} from 'react-icons/fi';
import BookingStatsCards from '@/components/BookingStatsCards';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalDrivers: number;
  totalStaff: number;
  checkedInDrivers: number;
  checkedInStaff: number;
  hourlyTickets: Array<{
    _id: number;
    count: number;
    revenue: number;
  }>;
  paymentMethodStats: {
    cash: number;
    qr: number;
  };
  bookingSystem?: {
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
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchStats = async (date?: string) => {
    try {
      setLoading(true);
      const queryDate = date || selectedDate;
      const response = await fetch(`/api/dashboard/stats?startDate=${queryDate}&endDate=${queryDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleRefresh = () => {
    fetchStats();
  };

  // Chart data for hourly tickets
  const chartData = stats ? {
    labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    datasets: [
      {
        label: 'ຈຳນວນປີ້',
        data: Array.from({ length: 24 }, (_, hour) => {
          const hourData = stats.hourlyTickets.find(h => h._id === hour);
          return hourData ? hourData.count : 0;
        }),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'ການຂາຍປີ້ຕາມເວລາ',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">ສະບາຍດີ, {session?.user?.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FiCalendar className="text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              ອັບເດດ
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          ຂໍ້ມູນວັນທີ: {new Date(selectedDate).toLocaleDateString('lo-LA')}
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">ກຳລັງໂຫລດຂໍ້ມູນ...</span>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <FiDollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">ລາຍຮັບລວມ</p>
                  <p className="text-2xl font-bold text-blue-900">₭{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">ປີ້ທີ່ຂາຍໄດ້</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalTicketsSold}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">ພະນັກງານເຂົ້າວຽກ</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.checkedInDrivers + stats.checkedInStaff}
                  </p>
                  <p className="text-xs text-purple-600">
                    ຄົນຂັບ: {stats.checkedInDrivers} | ພະນັກງານ: {stats.checkedInStaff}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">ເງິນສົດ/QR</p>
                  <p className="text-lg font-bold text-orange-900">
                    {stats.paymentMethodStats.cash}% / {stats.paymentMethodStats.qr}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 🆕 Booking System Statistics */}
          {stats.bookingSystem && (
            <BookingStatsCards 
              bookingStats={stats.bookingSystem} 
              isLoading={loading} 
            />
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ການຂາຍປີ້ຕາມເວລາ</h3>
              {chartData && (
                <div className="h-64">
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Enhanced */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ການດຳເນີນການດ່ວນ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/dashboard/tickets"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                  <span className="ml-2 font-medium">ອອກປີ້</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">ອອກປີ້ໃຫ້ຜູ້ໂດຍສານ</p>
              </a>

              <a
                href="/dashboard/bookings"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center">
                  <FiCalendar className="h-5 w-5 text-green-600 group-hover:text-green-700" />
                  <span className="ml-2 font-medium">ຈັດການການຈອງ</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  ອະນຸມັດການຈອງ ({stats.bookingSystem?.bookingsByStatus.pending.count || 0} ລໍຖ້າ)
                </p>
              </a>

              <a
                href="/dashboard/users"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center">
                  <FiUsers className="h-5 w-5 text-purple-600 group-hover:text-purple-700" />
                  <span className="ml-2 font-medium">ຈັດການຜູ້ໃຊ້</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">ເພີ່ມ/ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້</p>
              </a>

              <a
                href="/dashboard/revenue"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center">
                  <FiDollarSign className="h-5 w-5 text-orange-600 group-hover:text-orange-700" />
                  <span className="ml-2 font-medium">ລາຍງານລາຍຮັບ</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">ເບິ່ງລາຍງານລາຍຮັບລະອຽດ</p>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ລອງໃໝ່
          </button>
        </div>
      )}
    </div>
  );
}