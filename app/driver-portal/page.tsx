// app/driver-portal/page.tsx - ตาม UI ที่ต้องการ
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FiDollarSign, 
  FiCalendar, 
  FiRefreshCw,
  FiDownload
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface RevenueData {
  totalRevenue: number;
  todayRevenue: number;
  stationRevenue: number;
  driverRevenue: number;
  workingDriversCount: number;
  driverShare: number;
  myShare: number;
  ticketsCount: number;
}

export default function DriverPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 1350000,
    todayRevenue: 135000,
    stationRevenue: 67500,
    driverRevenue: 1147500,
    workingDriversCount: 8,
    driverShare: 1147500,
    myShare: 143437,
    ticketsCount: 30
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('วันนี้');

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch data function
  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      // TODO: เรียก API จริง
      // const response = await fetch('/api/driver/income?type=daily');
      // const data = await response.json();
      // setRevenueData(data);
      
      // Mock data for now
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver') {
      fetchRevenueData();
    }
  }, [status, session]);

  // Format currency
  const formatCurrency = (amount: number) => `₭${amount.toLocaleString()}`;

  // Pie chart data
  const chartData = {
    labels: ['ບໍລິສັດ (10%)', 'ສະຖານີ (5%)', 'ຄົນຂັບ (85%)'],
    datasets: [
      {
        data: [
          revenueData.totalRevenue * 0.10,
          revenueData.totalRevenue * 0.05,
          revenueData.totalRevenue * 0.85
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  };

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

  if (status === 'loading' || loading) {
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
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchRevenueData}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
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
        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <FiCalendar className="mr-2 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">ເລືອກຊ່ວງເວລາ</h2>
          </div>
          <div className="flex space-x-2">
            {['ວັນນີ້', 'ອາທິດ', 'ເດືອນ', 'ໄຕມາດ', 'ປີ'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Summary Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍຮັບລວມ</h3>
          <p className="text-sm text-gray-500 mb-4">6/5/2025 - 6/6/2025</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevenueCard
              title="ລາຍຮັບລວມ"
              amount={revenueData.totalRevenue}
              color="blue"
            />
            <RevenueCard
              title="ວັນນີ້"
              amount={revenueData.todayRevenue}
              color="green"
            />
            <RevenueCard
              title="ສະຖານີ"
              amount={revenueData.stationRevenue}
              color="purple"
            />
            <RevenueCard
              title="ຄົນຂັບ"
              amount={revenueData.driverRevenue}
              color="orange"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ການແບ່ງລາຍຮັບ</h3>
            <div className="h-80">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ລາຍຮັບລວມ</h3>
            <div className="space-y-4">
              <RevenueBreakdownItem
                label="ບໍລິສັດ (10%)"
                amount={revenueData.totalRevenue * 0.10}
                transactions={1}
                color="blue"
              />
              <RevenueBreakdownItem
                label="ສະຖານີ (5%)"
                amount={revenueData.totalRevenue * 0.05}
                transactions={1}
                color="green"
              />
              <RevenueBreakdownItem
                label="ຄົນຂັບ (85%)"
                amount={revenueData.totalRevenue * 0.85}
                transactions={1}
                color="orange"
              />
            </div>

            {/* รายรับต่อคน - ส่วนที่เพิ่มใหม่ */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">ລາຍຮັບຕໍ່ຄົນ</h4>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">ລາຍຮັບຂອງທ່ານ</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(revenueData.myShare)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600">ຈາກ {revenueData.ticketsCount} ໃບ</p>
                    <p className="text-xs text-blue-600">ແບ່ງກັບ {revenueData.workingDriversCount} ຄົນ</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>ຄົນຂັບທີ່ເຮັດວຽກ:</span>
                    <span className="font-medium">{revenueData.workingDriversCount} ຄົນ</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>ລາຍຮັບສ່ວນຄົນຂັບລວມ:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(revenueData.driverRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>ລາຍຮັບເຉລຍຕໍ່ຄົນ:</span>
                    <span className="font-medium text-green-600">{formatCurrency(Math.round(revenueData.driverRevenue / revenueData.workingDriversCount))}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-blue-700 font-medium">ສ່ວນແບ່ງຂອງທ່ານ:</span>
                    <span className="font-bold text-blue-700 text-lg">{formatCurrency(revenueData.myShare)}</span>
                  </div>
                </div>
              </div>

              {/* คำอธิบายการคิดไล่ */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>💡 ວິທີຄິດໄລ່:</strong> ລາຍຮັບ 85% ({formatCurrency(revenueData.driverRevenue)}) ÷ {revenueData.workingDriversCount} ຄົນຂັບ = {formatCurrency(Math.round(revenueData.driverRevenue / revenueData.workingDriversCount))} ຕໍ່ຄົນ
                </p>
              </div>
            </div>
          </div>
        </div>
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