// app/dashboard/revenue/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiCalendar,
  FiPieChart,
  FiRefreshCw,
  FiBarChart
} from 'react-icons/fi';

interface RevenueData {
  summary: {
    totalTickets: number;
    totalRevenue: number;
    averageTicketPrice: number;
    revenueShare: {
      company: number;
      station: number;
      drivers: number;
    };
    sharePercentages: {
      company: number;
      station: number;
      drivers: number;
    };
  };
  dailyData: Array<{
    date: string;
    totalRevenue: number;
    totalTickets: number;
    companyShare: number;
    stationShare: number;
    driversShare: number;
  }>;
  paymentMethodBreakdown: Record<string, { count: number; revenue: number }>;
}

export default function RevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ดึงข้อมูลรายได้
  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        period: 'daily'
      });
      
      const response = await fetch(`/api/revenue?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRevenueData();
    }
  }, [status, startDate, endDate]);

  // ข้อมูลสำหรับ Pie Chart
  const pieChartData = revenueData ? [
    { 
      name: 'ບໍລິສັດແມ່', 
      value: revenueData.summary.revenueShare.company,
      percentage: revenueData.summary.sharePercentages.company,
      color: '#3B82F6'
    },
    { 
      name: 'ສະຖານີ', 
      value: revenueData.summary.revenueShare.station,
      percentage: revenueData.summary.sharePercentages.station,
      color: '#F59E0B'
    },
    { 
      name: 'ພະນັກງານຂັບລົດ', 
      value: revenueData.summary.revenueShare.drivers,
      percentage: revenueData.summary.sharePercentages.drivers,
      color: '#10B981'
    }
  ] : [];

  // ข้อมูลสำหรับ Bar Chart รายวัน
  const dailyChartData = revenueData?.dailyData.map(day => ({
    date: new Date(day.date).toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit' }),
    'ບໍລິສັດແມ່': day.companyShare,
    'ສະຖານີ': day.stationShare,
    'ພະນັກງານຂັບລົດ': day.driversShare,
    'ລວມ': day.totalRevenue
  })) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('lo-LA').format(amount);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>ກຳລັງໂຫລດຂໍ້ມູນ...</p>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p>ບໍ່ສາມາດໂຫລດຂໍ້ມູນລາຍຮັບໄດ້</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ຂໍ້ມູນລາຍຮັບ</h1>
          <p className="text-gray-600 mt-1">ສະຫຼຸບລາຍຮັບຈາກການຂາຍປີ້ລົດຕູ້ໂດຍສານ</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-gray-500" size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
            <span>ຮອດ</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
          <button
            onClick={fetchRevenueData}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
            ອັບເດດ
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <NeoCard className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <FiBarChart className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase font-medium">ຈຳນວນປີ້</p>
              <p className="text-2xl font-bold">{revenueData.summary.totalTickets}</p>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FiDollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase font-medium">ລາຍຮັບລວມ</p>
              <p className="text-2xl font-bold">₭{formatCurrency(revenueData.summary.totalRevenue)}</p>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <FiTrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase font-medium">ລາຄາເຄິ່ງປີ້</p>
              <p className="text-2xl font-bold">₭{formatCurrency(revenueData.summary.averageTicketPrice)}</p>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <FiPieChart className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase font-medium">ສ່ວນຄົນຂັບ</p>
              <p className="text-2xl font-bold">₭{formatCurrency(revenueData.summary.revenueShare.drivers)}</p>
            </div>
          </div>
        </NeoCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart - การแบ่งรายได้ */}
        <NeoCard className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <FiPieChart className="mr-2 text-blue-600" />
            ການແບ່ງລາຍຮັບ
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`₭${formatCurrency(value)}`, 'ຈຳນວນເງິນ']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        {/* Revenue Breakdown */}
        <NeoCard className="p-6">
          <h3 className="text-lg font-bold mb-4">ລາຍລະອຽດການແບ່ງລາຍຮັບ</h3>
          <div className="space-y-4">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.percentage}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₭{formatCurrency(item.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </NeoCard>
      </div>

      {/* Daily Revenue Chart */}
      {dailyChartData.length > 0 && (
        <NeoCard className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <FiBarChart className="mr-2 text-green-600" />
            ລາຍຮັບແຍກຕາມວັນ
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `₭${formatCurrency(value)}`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`₭${formatCurrency(value)}`, name]}
                />
                <Legend />
                <Bar dataKey="ບໍລິສັດແມ່" fill="#3B82F6" />
                <Bar dataKey="ສະຖານີ" fill="#F59E0B" />
                <Bar dataKey="ພະນັກງານຂັບລົດ" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>
      )}

      {/* Payment Method Breakdown */}
      <NeoCard className="p-6 mt-6">
        <h3 className="text-lg font-bold mb-4">ແຍກຕາມວິທີການຊຳລະ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(revenueData.paymentMethodBreakdown).map(([method, data]) => (
            <div key={method} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {method === 'cash' ? 'ເງິນສົດ' : method === 'qr' ? 'ເງິນໂອນ' : method}
                </span>
                <span className="text-sm text-gray-600">{data.count} ໃບ</span>
              </div>
              <p className="text-xl font-bold">₭{formatCurrency(data.revenue)}</p>
              <div className="mt-2 text-sm text-gray-600">
                ເຄິ່ງປີ້: ₭{formatCurrency(Math.round(data.revenue / data.count))}
              </div>
            </div>
          ))}
        </div>
      </NeoCard>
    </div>
  );
}