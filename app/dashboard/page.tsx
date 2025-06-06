'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalDrivers: number;
  totalStaff: number;
  checkedInDrivers: number;
  checkedInStaff: number;
  hourlyTickets: Array<{ _id: number; count: number; revenue: number }>;
  paymentMethodStats: { cash: number; qr: number };
}

// Enhanced Card Component
const NeoCard = ({ children, className = "", gradient = false, ...props }: {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  [key: string]: any;
}) => (
  <div 
    className={`
      ${gradient 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200' 
        : 'bg-white border-gray-200'
      }
      border rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300
      backdrop-blur-sm ${className}
    `} 
    {...props}
  >
    {children}
  </div>
);

export default function EnhancedDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalDrivers: 0,
    totalStaff: 0,
    checkedInDrivers: 0,
    checkedInStaff: 0,
    hourlyTickets: [],
    paymentMethodStats: { cash: 65, qr: 35 }
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [session, status, router, startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();
    
    switch (range) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(weekAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setStartDate(monthAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
    }
  };

  // Chart Data Preparation
  const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  
  const hourlyTicketsData = {
    labels: hourlyLabels,
    datasets: [{
      label: 'ຈຳນວນປີ້',
      data: hourlyLabels.map((_, hour) => {
        const found = stats.hourlyTickets.find(h => h._id === hour);
        return found ? found.count : 0;
      }),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      borderWidth: 2
    }]
  };

  const hourlyRevenueData = {
    labels: hourlyLabels,
    datasets: [{
      label: 'ລາຍຮັບ (₭)',
      data: hourlyLabels.map((_, hour) => {
        const found = stats.hourlyTickets.find(h => h._id === hour);
        return found ? found.revenue : 0;
      }),
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: '#10B981',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  const paymentMethodData = {
    labels: ['ເງິນສົດ', 'ເງິນໂອນ'],
    datasets: [{
      data: [stats.paymentMethodStats.cash, stats.paymentMethodStats.qr],
      backgroundColor: ['#3B82F6', '#10B981'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  // Calculate additional metrics
  const averageTicketPrice = stats.totalTicketsSold > 0 ? Math.round(stats.totalRevenue / stats.totalTicketsSold) : 0;
  const driverUtilization = stats.totalDrivers > 0 ? Math.round((stats.checkedInDrivers / stats.totalDrivers) * 100) : 0;
  const staffUtilization = stats.totalStaff > 0 ? Math.round((stats.checkedInStaff / stats.totalStaff) * 100) : 0;

  // Revenue breakdown
  const companyRevenue = Math.round(stats.totalRevenue * 0.10);
  const stationRevenue = Math.round(stats.totalRevenue * 0.05);
  const driverRevenue = Math.round(stats.totalRevenue * 0.85);

  const MetricCard = ({ icon, title, value, subtitle, trend, color = "blue" }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number;
    color?: "blue" | "green" | "purple" | "orange";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 border-blue-200 text-blue-900",
      green: "bg-green-50 border-green-200 text-green-900", 
      purple: "bg-purple-50 border-purple-200 text-purple-900",
      orange: "bg-orange-50 border-orange-200 text-orange-900"
    };

    return (
      <NeoCard className={`p-6 ${colorClasses[color]}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{icon}</span>
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-80">{title}</h3>
            </div>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
          </div>
          {trend !== undefined && (
            <div className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </NeoCard>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 ໜ້າຫຼັກລະບົບຂາຍປີ້</h1>
            <p className="text-gray-600">ພາບລວມການດຳເນີນງານ ແລະ ສະຖິຕິການຂາຍປະຈຳວັນ</p>
          </div>
          
          {/* Date Range Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              {['today', 'week', 'month'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleDateRangeChange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range === 'today' ? 'ມື້ນີ້' : range === 'week' ? 'ອາທິດນີ້' : 'ເດືອນນີ້'}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500">ຮອດ</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon="🎫"
          title="ຈຳນວນປີ້ທີ່ຂາຍ"
          value={stats.totalTicketsSold.toLocaleString()}
          subtitle={`ລາຄາເຉລີ່ຍ: ₭${averageTicketPrice.toLocaleString()}`}
          color="blue"
        />
        
        <MetricCard
          icon="💰"
          title="ລາຍຮັບລວມ"
          value={`₭${stats.totalRevenue.toLocaleString()}`}
          subtitle="ໃນຊ່ວງເວລາທີ່ເລືອກ"
          color="green"
        />
        
        <MetricCard
          icon="🚗"
          title="ພະນັກງານຂັບລົດ"
          value={`${stats.checkedInDrivers}/${stats.totalDrivers}`}
          subtitle={`${driverUtilization}% ເຂົ້າວຽກ`}
          color="purple"
        />
        
        <MetricCard
          icon="👥"
          title="ພະນັກງານຂາຍປີ້"
          value={`${stats.checkedInStaff}/${stats.totalStaff}`}
          subtitle={`${staffUtilization}% ເຂົ້າວຽກ`}
          color="orange"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <NeoCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💼 ການແບ່ງປັນລາຍຮັບ</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-700">ລາຍຮັບບໍລິສັດ (10%)</span>
              <span className="font-bold text-blue-900">₭{companyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">ລາຍຮັບສະຖານີ (5%)</span>
              <span className="font-bold text-blue-900">₭{stationRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">ລາຍຮັບຄົນຂັບ (85%)</span>
              <span className="font-bold text-blue-900">₭{driverRevenue.toLocaleString()}</span>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 ປະເພດການຊຳລະ</h3>
          <div className="flex items-center justify-center">
            <div className="w-32 h-32">
              <Doughnut 
                data={paymentMethodData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { padding: 20, usePointStyle: true }
                    }
                  }
                }}
              />
            </div>
          </div>
        </NeoCard>

        <div className="space-y-4">
          <NeoCard className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">ເງິນສົດ</p>
                <p className="text-2xl font-bold text-green-900">{stats.paymentMethodStats.cash}%</p>
              </div>
              <div className="text-3xl">💵</div>
            </div>
          </NeoCard>
          
          <NeoCard className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">ເງິນໂອນ</p>
                <p className="text-2xl font-bold text-blue-900">{stats.paymentMethodStats.qr}%</p>
              </div>
              <div className="text-3xl">📱</div>
            </div>
          </NeoCard>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeoCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 ການຂາຍປີ້ຕໍ່ຊົວໂມງ</h3>
          <div className="h-80">
            <Line 
              data={hourlyTicketsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#3B82F6',
                    borderWidth: 1
                  }
                },
                scales: {
                  x: { 
                    grid: { display: false },
                    ticks: { color: '#6B7280' }
                  },
                  y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { color: '#6B7280' }
                  }
                },
                elements: {
                  point: { hoverBackgroundColor: '#3B82F6' }
                }
              }}
            />
          </div>
        </NeoCard>

        <NeoCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 ລາຍຮັບຕໍ່ຊົວໂມງ</h3>
          <div className="h-80">
            <Bar 
              data={hourlyRevenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    callbacks: {
                      label: (context) => `ລາຍຮັບ: ₭${context.parsed.y.toLocaleString()}`
                    }
                  }
                },
                scales: {
                  x: { 
                    grid: { display: false },
                    ticks: { color: '#6B7280' }
                  },
                  y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { 
                      color: '#6B7280',
                      callback: (value) => `₭${value.toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </div>
        </NeoCard>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>ຂໍ້ມູນອັດເດດຄັ້ງລ່າສຸດ: {new Date().toLocaleString('lo-LA')}</p>
      </div>
    </div>
  );
}