// app/dashboard/reports/page.tsx - เปลี่ยนเป็นภาษาลาว
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { 
  FiCalendar, 
  FiDownload, 
  FiUsers,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiTrendingUp,
  FiCreditCard,
  FiBarChart,
} from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ReportData {
  type: string;
  period: { startDate: string; endDate: string };
  summary: any;
  [key: string]: any;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [selectedReport, setSelectedReport] = useState('summary');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReport();
    }
  }, [status, selectedReport, selectedPeriod, startDate, endDate]);

  const reportTypes = [
    {
      id: 'summary',
      title: 'ສະຫຼຸບລວມ',
      icon: <FiBarChart />,
      description: 'ພາບລວມສະຖິຕິທັງໝົດ'
    },
    {
      id: 'sales',
      title: 'ບົດລາຍງານຍອດຂາຍ',
      icon: <FiCreditCard />,
      description: 'ສະຫຼຸບຍອດຂາຍແລະລາຍຮັບ'
    },
    {
      id: 'drivers',
      title: 'ບົດລາຍງານຄົນຂັບ',
      icon: <FiUsers />,
      description: 'ສະຖິຕິແລະປະສິດທິພາບຄົນຂັບ'
    },
    {
      id: 'financial',
      title: 'ບົດລາຍງານການເງິນ',
      icon: <FiDollarSign />,
      description: 'ການແບ່ງລາຍຮັບແລະຜົນກຳໄລ'
    }
  ];

  const timeRanges = [
    { value: 'today', label: 'ມື້ນີ້' },
    { value: 'yesterday', label: 'ມື້ວານ' },
    { value: 'thisWeek', label: 'ອາທິດນີ້' },
    { value: 'thisMonth', label: 'ເດືອນນີ້' },
    { value: 'custom', label: 'ກຳນົດເອງ' }
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      let actualStartDate = startDate;
      let actualEndDate = endDate;

      // Calculate dates based on selected period
      if (selectedPeriod !== 'custom') {
        const today = new Date();
        switch (selectedPeriod) {
          case 'today':
            actualStartDate = today.toISOString().split('T')[0];
            actualEndDate = today.toISOString().split('T')[0];
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            actualStartDate = yesterday.toISOString().split('T')[0];
            actualEndDate = yesterday.toISOString().split('T')[0];
            break;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            actualStartDate = weekStart.toISOString().split('T')[0];
            actualEndDate = today.toISOString().split('T')[0];
            break;
          case 'thisMonth':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            actualStartDate = monthStart.toISOString().split('T')[0];
            actualEndDate = today.toISOString().split('T')[0];
            break;
        }
      }

      const response = await fetch(
        `/api/reports?type=${selectedReport}&startDate=${actualStartDate}&endDate=${actualEndDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: string) => {
    // Implementation for exporting reports
    console.log(`Exporting report as ${format}`);
    // You can implement PDF, Excel, CSV export here
  };

  const renderSummaryReport = () => {
    if (!reportData?.quickStats) return null;

    const stats = reportData.quickStats;
    
    return (
      <div className="space-y-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiCreditCard className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600 font-medium">ປີ້ທີ່ຂາຍ</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalTickets}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiDollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">ລາຍຮັບລວມ</p>
                <p className="text-2xl font-bold text-green-900">₭{stats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiUsers className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600 font-medium">ຄົນຂັບເຂົ້າວຽກ</p>
                <p className="text-2xl font-bold text-purple-900">{stats.activeDrivers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiTrendingUp className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-600 font-medium">ລາຄາເຊລີ່ຍ</p>
                <p className="text-2xl font-bold text-orange-900">₭{stats.avgTicketPrice?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiBarChart className="mr-2" />
              ຍອດຂາຍ
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ປີ້ທັງໝົດ:</span>
                <span className="font-semibold">{reportData.sales?.totalTickets || 0} ໃບ</span>
              </div>
              <div className="flex justify-between">
                <span>ລາຍຮັບ:</span>
                <span className="font-semibold">₭{reportData.sales?.totalRevenue?.toLocaleString() || 0}</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiUsers className="mr-2" />
              ຄົນຂັບ
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ຄົນຂັບທັງໝົດ:</span>
                <span className="font-semibold">{reportData.drivers?.totalDrivers || 0} ຄົນ</span>
              </div>
              <div className="flex justify-between">
                <span>ເຂົ້າວຽກມື້ນີ້:</span>
                <span className="font-semibold">{reportData.drivers?.activeDrivers || 0} ຄົນ</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiDollarSign className="mr-2" />
              ການເງິນ
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ລາຍຮັບລວມ:</span>
                <span className="font-semibold">₭{reportData.financial?.totalRevenue?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ສ່ວນແບ່ງຄົນຂັບ:</span>
                <span className="font-semibold">₭{reportData.financial?.driverShare?.toLocaleString() || 0}</span>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    if (!reportData?.paymentMethods) return null;

    // Prepare chart data
    const paymentData = {
      labels: reportData.paymentMethods.map((pm: any) => 
        pm._id === 'cash' ? 'ເງິນສົດ' : pm._id === 'qr' ? 'ເງິນໂອນ' : pm._id
      ),
      datasets: [{
        data: reportData.paymentMethods.map((pm: any) => pm.count),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 2
      }]
    };

    const hourlyData = {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'ຈຳນວນປີ້',
        data: Array.from({length: 24}, (_, i) => {
          const hourData = reportData.hourlySales?.find((h: any) => h._id === i);
          return hourData ? hourData.count : 0;
        }),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">ການຊຳລະເງິນ</h3>
            <div className="h-64">
              <Doughnut data={paymentData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">ຍອດຂາຍລາຍຊົ່ວໂມງ</h3>
            <div className="h-64">
              <Line data={hourlyData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>
        </div>

        <NeoCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">ສະຫຼຸບຍອດຂາຍ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reportData.summary?.totalTickets || 0}</p>
              <p className="text-sm text-gray-600">ປີ້ທີ່ຂາຍ</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₭{reportData.summary?.totalRevenue?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">ລາຍຮັບລວມ</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">₭{reportData.summary?.averagePrice?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">ລາຄາເຊລີ່ຍ</p>
            </div>
          </div>
        </NeoCard>
      </div>
    );
  };

  const renderDriverReport = () => {
    if (!reportData?.drivers) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{reportData.summary?.totalDrivers || 0}</p>
            <p className="text-sm text-blue-600">ຄົນຂັບທັງໝົດ</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{reportData.summary?.activeDrivers || 0}</p>
            <p className="text-sm text-green-600">ເຂົ້າວຽກມື້ນີ້</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{reportData.summary?.totalWorkDays || 0}</p>
            <p className="text-sm text-purple-600">ວັນທຳວຽກລວມ</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">₭{reportData.summary?.totalIncome?.toLocaleString() || 0}</p>
            <p className="text-sm text-orange-600">ລາຍຮັບລວມ</p>
          </div>
        </div>

        <NeoCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">ລາຍລະອຽດຄົນຂັບ</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ຊື່</th>
                  <th className="text-left p-2">ລະຫັດພະນັກງານ</th>
                  <th className="text-left p-2">ສະຖານະ</th>
                  <th className="text-right p-2">ລາຍຮັບ</th>
                  <th className="text-right p-2">ຈຳນວນປີ້</th>
                </tr>
              </thead>
              <tbody>
                {reportData.drivers?.map((driver: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{driver.name}</td>
                    <td className="p-2">{driver.employeeId}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        driver.checkInStatus === 'checked-in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
                      </span>
                    </td>
                    <td className="p-2 text-right">₭{driver.totalIncome?.toLocaleString() || 0}</td>
                    <td className="p-2 text-right">{driver.ticketCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NeoCard>
      </div>
    );
  };

  const renderFinancialReport = () => {
    if (!reportData?.breakdown) return null;

    const breakdown = reportData.breakdown;
    const chartData = {
      labels: ['ບໍລິສັດ (10%)', 'ສະຖານີ (5%)', 'ຄົນຂັບ (85%)'],
      datasets: [{
        data: [
          breakdown.company?.totalAmount || 0,
          breakdown.station?.totalAmount || 0,
          breakdown.driver?.totalAmount || 0
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 2
      }]
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">₭{reportData.summary?.totalRevenue?.toLocaleString() || 0}</p>
            <p className="text-sm text-blue-600">ລາຍຮັບລວມ</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">₭{reportData.summary?.companyShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-green-600">ສ່ວນແບ່ງບໍລິສັດ</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">₭{reportData.summary?.stationShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-purple-600">ສ່ວນແບ່ງສະຖານີ</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">₭{reportData.summary?.driverShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-orange-600">ສ່ວນແບ່ງຄົນຂັບ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">ການແບ່ງລາຍຮັບ</h3>
            <div className="h-64">
              <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">ລາຍລະອຽດການແບ່ງລາຍຮັບ</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">ບໍລິສັດ (10%)</p>
                  <p className="text-sm text-blue-600">{breakdown.company?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="text-lg font-bold text-blue-600">₭{breakdown.company?.totalAmount?.toLocaleString() || 0}</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">ສະຖານີ (5%)</p>
                  <p className="text-sm text-green-600">{breakdown.station?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="text-lg font-bold text-green-600">₭{breakdown.station?.totalAmount?.toLocaleString() || 0}</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-900">ຄົນຂັບ (85%)</p>
                  <p className="text-sm text-orange-600">{breakdown.driver?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="text-lg font-bold text-orange-600">₭{breakdown.driver?.totalAmount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">ບໍ່ມີຂໍ້ມູນບົດລາຍງານ</p>
        </div>
      );
    }

    switch (selectedReport) {
      case 'summary':
        return renderSummaryReport();
      case 'sales':
        return renderSalesReport();
      case 'drivers':
        return renderDriverReport();
      case 'financial':
        return renderFinancialReport();
      default:
        return <div>ປະເພດບົດລາຍງານບໍ່ຖືກຕ້ອງ</div>;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 ລະບົບບົດລາຍງານ</h1>
        <p className="text-gray-600">ຈັດການແລະສ້າງບົດລາຍງານທຸກປະເພດສຳລັບທຸລະກິດຂາຍປີ້ລົດໂດຍສານ</p>
      </div>

      {/* Report Type Selection */}
      <NeoCard className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FiFilter className="mr-2" />
          ເລືອກປະເພດບົດລາຍງານ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`p-2 rounded-full mr-3 ${
                  selectedReport === report.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {report.icon}
                </div>
                <h3 className="font-semibold">{report.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{report.description}</p>
            </button>
          ))}
        </div>
      </NeoCard>

      {/* Time Range Selection */}
      <NeoCard className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <FiCalendar className="mr-2" />
            ເລືອກຊ່ວງເວລາ
          </h2>
          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              ອັບເດດ
            </button>
            <button
              onClick={() => exportReport('PDF')}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FiDownload className="mr-2" />
              ອອກ PDF
            </button>
            <button
              onClick={() => exportReport('Excel')}
              className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <FiDownload className="mr-2" />
              ອອກ Excel
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-4">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedPeriod(range.value)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selectedPeriod === range.value
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        
        {selectedPeriod === 'custom' && (
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ວັນທີ່ເລີ່ມຕົ້ນ</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ວັນທີ່ສິ້ນສຸດ</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}
      </NeoCard>

      {/* Report Content */}
      <NeoCard className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {reportTypes.find(r => r.id === selectedReport)?.title || 'ບົດລາຍງານ'}
          </h2>
          {reportData && (
            <div className="text-sm text-gray-500">
              ຂໍ້ມູນ: {new Date(reportData.period.startDate).toLocaleDateString('lo-LA')} - {new Date(reportData.period.endDate).toLocaleDateString('lo-LA')}
            </div>
          )}
        </div>
        
        {renderReportContent()}
      </NeoCard>
    </div>
  );
}