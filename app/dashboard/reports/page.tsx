// app/dashboard/reports/page.tsx
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
      title: 'สรุปภาพรวม',
      icon: <FiBarChart />,
      description: 'ภาพรวมสถิติทั้งหมด'
    },
    {
      id: 'sales',
      title: 'รายงานยอดขาย',
      icon: <FiCreditCard />,
      description: 'สรุปยอดขายและรายได้'
    },
    {
      id: 'drivers',
      title: 'รายงานคนขับ',
      icon: <FiUsers />,
      description: 'สถิติและประสิทธิภาพคนขับ'
    },
    {
      id: 'financial',
      title: 'รายงานการเงิน',
      icon: <FiDollarSign />,
      description: 'การแบ่งรายได้และผลกำไร'
    }
  ];

  const timeRanges = [
    { value: 'today', label: 'วันนี้' },
    { value: 'yesterday', label: 'เมื่อวาน' },
    { value: 'thisWeek', label: 'สัปดาห์นี้' },
    { value: 'thisMonth', label: 'เดือนนี้' },
    { value: 'custom', label: 'กำหนดเอง' }
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
                <p className="text-sm text-blue-600 font-medium">ตั๋วที่ขาย</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalTickets}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiDollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">รายได้รวม</p>
                <p className="text-2xl font-bold text-green-900">₭{stats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiUsers className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600 font-medium">คนขับเข้างาน</p>
                <p className="text-2xl font-bold text-purple-900">{stats.activeDrivers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiTrendingUp className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-600 font-medium">ราคาเฉลี่ย</p>
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
              ยอดขาย
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ตั๋วทั้งหมด:</span>
                <span className="font-semibold">{reportData.sales?.totalTickets || 0} ใบ</span>
              </div>
              <div className="flex justify-between">
                <span>รายได้:</span>
                <span className="font-semibold">₭{reportData.sales?.totalRevenue?.toLocaleString() || 0}</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiUsers className="mr-2" />
              คนขับ
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>คนขับทั้งหมด:</span>
                <span className="font-semibold">{reportData.drivers?.totalDrivers || 0} คน</span>
              </div>
              <div className="flex justify-between">
                <span>เข้างานวันนี้:</span>
                <span className="font-semibold">{reportData.drivers?.activeDrivers || 0} คน</span>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiDollarSign className="mr-2" />
              การเงิน
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>รายได้รวม:</span>
                <span className="font-semibold">₭{reportData.financial?.totalRevenue?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ส่วนแบ่งคนขับ:</span>
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
        pm._id === 'cash' ? 'เงินสด' : pm._id === 'qr' ? 'เงินโอน' : pm._id
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
        label: 'จำนวนตั๋ว',
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
            <h3 className="text-lg font-semibold mb-4">การชำระเงิน</h3>
            <div className="h-64">
              <Doughnut data={paymentData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">ยอดขายรายชั่วโมง</h3>
            <div className="h-64">
              <Line data={hourlyData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>
        </div>

        <NeoCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">สรุปยอดขาย</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reportData.summary?.totalTickets || 0}</p>
              <p className="text-sm text-gray-600">ตั๋วที่ขาย</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₭{reportData.summary?.totalRevenue?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">รายได้รวม</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">₭{reportData.summary?.averagePrice?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">ราคาเฉลี่ย</p>
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
            <p className="text-sm text-blue-600">คนขับทั้งหมด</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{reportData.summary?.activeDrivers || 0}</p>
            <p className="text-sm text-green-600">เข้างานวันนี้</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{reportData.summary?.totalWorkDays || 0}</p>
            <p className="text-sm text-purple-600">วันทำงานรวม</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">₭{reportData.summary?.totalIncome?.toLocaleString() || 0}</p>
            <p className="text-sm text-orange-600">รายได้รวม</p>
          </div>
        </div>

        <NeoCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">รายละเอียดคนขับ</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ชื่อ</th>
                  <th className="text-left p-2">รหัสพนักงาน</th>
                  <th className="text-left p-2">สถานะ</th>
                  <th className="text-right p-2">รายได้</th>
                  <th className="text-right p-2">จำนวนตั๋ว</th>
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
                        {driver.checkInStatus === 'checked-in' ? 'เข้างาน' : 'ออกงาน'}
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
      labels: ['บริษัท (10%)', 'สถานี (5%)', 'คนขับ (85%)'],
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
            <p className="text-sm text-blue-600">รายได้รวม</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">₭{reportData.summary?.companyShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-green-600">ส่วนแบ่งบริษัท</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">₭{reportData.summary?.stationShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-purple-600">ส่วนแบ่งสถานี</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">₭{reportData.summary?.driverShare?.toLocaleString() || 0}</p>
            <p className="text-sm text-orange-600">ส่วนแบ่งคนขับ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">การแบ่งรายได้</h3>
            <div className="h-64">
              <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">รายละเอียดการแบ่งรายได้</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">บริษัท (10%)</p>
                  <p className="text-sm text-blue-600">{breakdown.company?.transactionCount || 0} รายการ</p>
                </div>
                <p className="text-lg font-bold text-blue-600">₭{breakdown.company?.totalAmount?.toLocaleString() || 0}</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">สถานี (5%)</p>
                  <p className="text-sm text-green-600">{breakdown.station?.transactionCount || 0} รายการ</p>
                </div>
                <p className="text-lg font-bold text-green-600">₭{breakdown.station?.totalAmount?.toLocaleString() || 0}</p>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-900">คนขับ (85%)</p>
                  <p className="text-sm text-orange-600">{breakdown.driver?.transactionCount || 0} รายการ</p>
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
          <p className="text-gray-500">ไม่มีข้อมูลรายงาน</p>
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
        return <div>ประเภทรายงานไม่ถูกต้อง</div>;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 ระบบรายงาน</h1>
        <p className="text-gray-600">จัดการและสร้างรายงานทุกประเภทสำหรับธุรกิจขายตั๋วรถโดยสาร</p>
      </div>

      {/* Report Type Selection */}
      <NeoCard className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FiFilter className="mr-2" />
          เลือกประเภทรายงาน
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
            เลือกช่วงเวลา
          </h2>
          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              อัปเดต
            </button>
            <button
              onClick={() => exportReport('PDF')}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <FiDownload className="mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => exportReport('Excel')}
              className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <FiDownload className="mr-2" />
              Export Excel
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
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
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
            {reportTypes.find(r => r.id === selectedReport)?.title || 'รายงาน'}
          </h2>
          {reportData && (
            <div className="text-sm text-gray-500">
              ข้อมูล: {new Date(reportData.period.startDate).toLocaleDateString('th-TH')} - {new Date(reportData.period.endDate).toLocaleDateString('th-TH')}
            </div>
          )}
        </div>
        
        {renderReportContent()}
      </NeoCard>
    </div>
  );
}