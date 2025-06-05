'use client';

// Format currency
  const formatCurrency = (amount: number) => `₭${amount.toLocaleString()}`;// app/driver-portal/page.tsx - เชื่อมกับ API จริง

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardData {
  driver: {
    id: string;
    name: string;
    employeeId: string;
    checkInStatus: 'checked-in' | 'checked-out';
  };
  totalRevenue: number;
  totalTickets: number;
  todayRevenue: number;
  companyRevenue: number;
  stationRevenue: number;
  driverRevenue: number;
  workingDriversCount: number;
  myDailyIncome: number;
  myExpectedShare: number;
  myTicketsCount: number;
  monthlyIncome: number;
  monthlyDays: number;
  averagePerTicket: number;
  averageDriverShare: number;
  chartData: {
    company: number;
    station: number;
    drivers: number;
  };
  calculation: {
    totalRevenue: number;
    companyPercent: number;
    stationPercent: number;
    driversPercent: number;
    workingDrivers: number;
    sharePerDriver: number;
  };
}

export default function DriverPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('วันนี้');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch dashboard data
  const fetchDashboardData = async (date?: string) => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      
      const targetDate = date || selectedDate;
      console.log('Fetching dashboard data for date:', targetDate);
      
      const response = await fetch(`/api/driver/income?type=dashboard&date=${targetDate}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'เกີดຂໍ້ຜິດພາດໃນການໂຫລດຂໍ້ມູນ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    if (period === 'ກຳໜົດເອງ') {
      // Don't change dates, let user pick manually
      return;
    }
    
    let newStartDate = new Date();
    let newEndDate = new Date();
    
    switch (period) {
      case 'ວັນນີ້':
        // Same day
        break;
      case 'ມື້ວານ':
        newStartDate.setDate(newStartDate.getDate() - 1);
        newEndDate.setDate(newEndDate.getDate() - 1);
        break;
      case 'ອາທິດນີ້':
        // Get start of this week (Monday) to today
        const dayOfWeek = newStartDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        newStartDate.setDate(newStartDate.getDate() - daysToMonday);
        // End date stays today
        break;
      case 'ເດືອນນີ້':
        // Get first day of current month to today
        newStartDate.setDate(1);
        // End date stays today
        break;
    }
    
    const startDateString = newStartDate.toISOString().split('T')[0];
    const endDateString = newEndDate.toISOString().split('T')[0];
    
    setStartDate(startDateString);
    setEndDate(endDateString);
    setSelectedDate(startDateString); // Keep for backward compatibility
    
    fetchDashboardData(startDateString, endDateString);
  };

  // Initial load
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver') {
      fetchDashboardData();
    }
  }, [status, session]);

  // Format date for Lao display (DD/MM/YYYY)
  const formatDateLao = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Prepare chart data
  const chartData = dashboardData ? {
    labels: ['ບໍລິສັດ (10%)', 'ສະຖານີ (5%)', 'ຄົນຂັບ (85%)'],
    datasets: [
      {
        data: [
          dashboardData.chartData.company,
          dashboardData.chartData.station,
          dashboardData.chartData.drivers
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.label + ': ' + formatCurrency(context.parsed);
          }
        }
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ລາຍຮັບຄົນຂັບ</h1>
              <p className="text-gray-600">ສະບາຍດີ, {session?.user?.name}</p>
              {dashboardData && (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    dashboardData.driver.checkInStatus === 'checked-in' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dashboardData.driver.checkInStatus === 'checked-in' ? (
                      <>
                        <FiCheckCircle className="mr-1" />
                        ເຂົ້າວຽກແລ້ວ
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="mr-1" />
                        ຍັງບໍ່ເຂົ້າວຽກ
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                ອັບເດດ
              </button>
              <button className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <FiDownload className="mr-2" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={handleRefresh}
                className="ml-auto text-red-600 hover:text-red-800 underline"
              >
                ລອງໃໝ່
              </button>
            </div>
          </div>
        )}

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <FiCalendar className="mr-2 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">ເລືອກຊ່ວງເວລາ</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              'ວັນນີ້', 
              'ມື້ວານ', 
              'ອາທິດນີ້', 
              'ເດືອນນີ້', 
              'ກຳໜົດເອງ'
            ].map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <div className={`${selectedPeriod === 'ກຳໜົດເອງ' ? 'opacity-100' : 'opacity-50'} ${selectedPeriod === 'ກຳໜົດເອງ' ? 'block' : 'hidden'}`}>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">ຈາກ:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedPeriod('ກຳໜົດເອງ');
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">ຫາ:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedPeriod('ກຳໜົດເອງ');
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={() => fetchDashboardData(startDate, endDate)}
                className="px-4 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
              >
                ອັບເດດ
              </button>
            </div>
          </div>
        </div>

        {loading && !dashboardData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600">ກຳລັງໂຫລດຂໍ້ມູນ...</span>
          </div>
        ) : dashboardData ? (
          <>
            {/* Revenue Summary Cards */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍຮັບລວມ</h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedPeriod === 'ວັນນີ້' && 'ວັນນີ້ - '}
                {selectedPeriod === 'ມື້ວານ' && 'ມື້ວານ - '}
                {selectedPeriod === 'ອາທິດນີ້' && 'ອາທິດນີ້ - '}
                {selectedPeriod === 'ເດືອນນີ້' && 'ເດືອນນີ້ - '}
                {selectedPeriod === 'ກຳໜົດເອງ' && 'ຊ່ວງທີ່ເລືອກ - '}
                {selectedPeriod === 'ກຳໜົດເອງ' 
                  ? `${formatDateLao(startDate)} - ${formatDateLao(endDate)}`
                  : formatDateLao(startDate)
                }
                {dashboardData.totalTickets > 0 && ` - ${dashboardData.totalTickets} ໃບ`}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RevenueCard
                  title="ລາຍຮັບລວມ"
                  amount={dashboardData.totalRevenue}
                  color="blue"
                />
                <RevenueCard
                  title="ວັນນີ້"
                  amount={dashboardData.todayRevenue}
                  color="green"
                />
                <RevenueCard
                  title="ສະຖານີ"
                  amount={dashboardData.stationRevenue}
                  color="purple"
                />
                <RevenueCard
                  title="ຄົນຂັບ"
                  amount={dashboardData.driverRevenue}
                  color="orange"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Distribution Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ການແບ່ງລາຍຮັບ</h3>
                {chartData && dashboardData.totalRevenue > 0 ? (
                  <div className="h-80">
                    <Doughnut data={chartData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <FiDollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p>ຍັງບໍ່ມີຂໍ້ມູນລາຍຮັບ</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍຮັບລວມ</h3>
                <div className="space-y-4">
                  <RevenueBreakdownItem
                    label="ບໍລິສັດ (10%)"
                    amount={dashboardData.companyRevenue}
                    transactions={dashboardData.totalTickets > 0 ? 1 : 0}
                    color="blue"
                  />
                  <RevenueBreakdownItem
                    label="ສະຖານີ (5%)"
                    amount={dashboardData.stationRevenue}
                    transactions={dashboardData.totalTickets > 0 ? 1 : 0}
                    color="green"
                  />
                  <RevenueBreakdownItem
                    label="ຄົນຂັບ (85%)"
                    amount={dashboardData.driverRevenue}
                    transactions={dashboardData.totalTickets > 0 ? 1 : 0}
                    color="orange"
                  />
                </div>

                {/* รายรับต่อคน */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">ລາຍຮັບຕໍ່ຄົນ</h4>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">ລາຍຮັບຂອງທ່ານ</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(dashboardData.myExpectedShare)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600">ຈາກ {dashboardData.totalTickets} ໃບ</p>
                        <p className="text-xs text-blue-600">ແບ່ງກັບ {dashboardData.workingDriversCount} ຄົນ</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>ຄົນຂັບທີ່ເຮັດວຽກ:</span>
                        <span className="font-medium">{dashboardData.workingDriversCount} ຄົນ</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>ລາຍຮັບສ່ວນຄົນຂັບລວມ:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(dashboardData.driverRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>ລາຍຮັບເຉລ່ຍຕໍ່ຄົນ:</span>
                        <span className="font-medium text-green-600">{formatCurrency(dashboardData.averageDriverShare)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-blue-700 font-medium">ສ່ວນແບ່ງຂອງທ່ານ:</span>
                        <span className="font-bold text-blue-700 text-lg">{formatCurrency(dashboardData.myExpectedShare)}</span>
                      </div>
                    </div>
                  </div>

                  {/* คำอธิบายการคิดไล่ */}
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>💡 ວິທີຄິດໄລ່:</strong> ລາຍຮັບ 85% ({formatCurrency(dashboardData.driverRevenue)}) ÷ {dashboardData.workingDriversCount} ຄົນຂັບ = {formatCurrency(dashboardData.averageDriverShare)} ຕໍ່ຄົນ
                    </p>
                  </div>

                  {/* สถานะการเข้าทำงาน */}
                  {dashboardData.driver.checkInStatus === 'checked-out' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-800">
                        <strong>⚠️ ຂໍ້ສັງເກດ:</strong> ທ່ານຍັງບໍ່ໄດ້ເຊັກອິນເຂົ້າວຽກ ກະລຸນາເຊັກອິນເພື່ອນັບລາຍຮັບ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Revenue Card Component
const RevenueCard: React.FC<{
  title: string;
  amount: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}> = ({ title, amount, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700'
  };

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4 text-center`}>
      <p className={`text-2xl font-bold ${textColorClasses[color]}`}>
        ₭{amount.toLocaleString()}
      </p>
      <p className={`text-sm ${textColorClasses[color]} mt-1`}>{title}</p>
    </div>
  );
};

// Revenue Breakdown Item Component
const RevenueBreakdownItem: React.FC<{
  label: string;
  amount: number;
  transactions: number;
  color: 'blue' | 'green' | 'orange';
}> = ({ label, amount, transactions, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div>
        <p className={`font-medium ${colorClasses[color]}`}>{label}</p>
        <p className="text-xs text-gray-500">{transactions} ລາຍການ</p>
      </div>
      <p className={`font-bold ${colorClasses[color]} text-lg`}>
        ₭{amount.toLocaleString()}
      </p>
    </div>
  );
};