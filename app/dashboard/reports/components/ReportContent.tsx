// app/dashboard/reports/components/ReportContent.tsx
import React from 'react';
import { FiCreditCard, FiDollarSign, FiUsers } from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Import new components
import VehiclesReportComponent from './VehiclesReportComponent';
import StaffReportComponent from './StaffReportComponent';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface ReportContentProps {
  reportData: any;
  reportType: string;
  loading: boolean;
}

const ReportContent: React.FC<ReportContentProps> = ({ reportData, reportType, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນບົດລາຍງານ</div>;
  }

  const renderSummaryReport = () => {
    const stats = reportData.quickStats || {};
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<FiCreditCard />} title="ປີ້ທີ່ຂາຍ" value={stats.totalTickets || 0} color="blue" />
          <StatCard icon={<FiDollarSign />} title="ລາຍຮັບລວມ" value={`₭${(stats.totalRevenue || 0).toLocaleString()}`} color="green" />
          <StatCard icon={<FiUsers />} title="ຄົນຂັບເຂົ້າວຽກ" value={stats.activeDrivers || 0} color="purple" />
          <StatCard icon="📊" title="ລາຄາເຊລີ່ຍ" value={`₭${(stats.avgTicketPrice || 0).toLocaleString()}`} color="orange" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ຍອດຂາຍ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ປີ້ທັງໝົດ:</span>
                <span className="font-semibold">{reportData.sales?.totalTickets || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ລາຍຮັບ:</span>
                <span className="font-semibold">₭{(reportData.sales?.totalRevenue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ຄົນຂັບ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ທັງໝົດ:</span>
                <span className="font-semibold">{reportData.drivers?.totalDrivers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>ເຂົ້າວຽກ:</span>
                <span className="font-semibold">{reportData.drivers?.activeDrivers || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ການເງິນ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ລາຍຮັບລວມ:</span>
                <span className="font-semibold">₭{(reportData.financial?.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>ສ່ວນແບ່ງຄົນຂັບ:</span>
                <span className="font-semibold">₭{(reportData.financial?.driverShare || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    if (!reportData?.paymentMethods) return null;

    const paymentData = {
      labels: reportData.paymentMethods.map((pm: any) => 
        pm._id === 'cash' ? 'ເງິນສົດ' : pm._id === 'qr' ? 'ເງິນໂອນ' : pm._id
      ),
      datasets: [{
        data: reportData.paymentMethods.map((pm: any) => pm.count),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      }]
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ການຊຳລະເງິນ</h3>
            <div className="h-48">
              <Doughnut data={paymentData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ສະຫຼຸບຍອດຂາຍ</h3>
            <div className="grid grid-cols-1 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-blue-600">{reportData.summary?.totalTickets || 0}</p>
                <p className="text-sm text-gray-600">ປີ້ທີ່ຂາຍ</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">₭{(reportData.summary?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-600">ລາຍຮັບລວມ</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-600">₭{(reportData.summary?.averagePrice || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-600">ລາຄາເຊລີ່ຍ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

const renderDriverReport = () => {
  if (!reportData || !Array.isArray(reportData.drivers)) {
    return <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນຄົນຂັບ</div>;
  }

  const summary = reportData.summary || {};
  const metadata = reportData.metadata || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="ຄົນຂັບທັງໝົດ" value={summary.totalDrivers || 0} color="blue" />
        <StatCard title="ຄົນຂັບທີ່ທຳງານ" value={summary.workingDriversInPeriod || 0} color="green" />
        <StatCard title="ວັນທຳວຽກລວມ" value={summary.totalWorkDays || 0} color="purple" />
        <StatCard title="ລາຍຮັບຕໍ່ຄົນ" value={`₭${(metadata.revenuePerDriver || 0).toLocaleString()}`} color="orange" />
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດຄົນຂັບ</h3>
        {reportData.drivers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນຄົນຂັບທີ່ມີລາຍຮັບໃນຊ່ວງເວລານີ້</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ຊື່</th>
                  <th className="text-left p-2">ລະຫັດ</th>
                  <th className="text-center p-2">ສະຖານະ</th>
                  <th className="text-center p-2">ວັນທຳງານ</th>
                  <th className="text-right p-2">ລາຍຮັບ (KIP)</th>
                  <th className="text-center p-2">ເຂົ້າວຽກ</th>
                  <th className="text-center p-2">ອອກວຽກ</th>
                </tr>
              </thead>
              <tbody>
                {reportData.drivers.slice(0, 10).map((driver: any, index: number) => (
                  <tr key={driver.id || index} className="border-b">
                    <td className="p-2 font-medium">{driver.name || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{driver.employeeId || 'N/A'}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        driver.performance === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {driver.performance === 'Active' ? 'ເຂົ້າວຽກ' : 'ບໍ່ເຂົ້າວຽກ'}
                      </span>
                    </td>
                    <td className="p-2 text-center">{driver.workDays || 0}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${(driver.totalIncome || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        ₭{(driver.totalIncome || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-2 text-center text-sm text-gray-600">
                      {driver.lastCheckIn 
                        ? new Date(driver.lastCheckIn).toLocaleDateString('lo-LA') + ' ' +
                          new Date(driver.lastCheckIn).toLocaleTimeString('lo-LA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '-'
                      }
                    </td>
                    <td className="p-2 text-center text-sm text-gray-600">
                      {driver.lastCheckOut 
                        ? new Date(driver.lastCheckOut).toLocaleDateString('lo-LA') + ' ' +
                          new Date(driver.lastCheckOut).toLocaleTimeString('lo-LA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* เพิ่มข้อความอธิบาย */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>📝 ໝາຍເຫດ:</strong> ຂໍ້ມູນທີ່ສະແດງເປັນຂໍ້ມູນໃນຊ່ວງເວລາທີ່ເລືອກເທົ່ານັ້ນ 
            (ເຂົ້າ-ອອກວຽກແມ່ນຄັ້ງລ່າສຸດໃນຊ່ວງເວລານັ້ນ)
          </p>
        </div>
      </div>
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
      }]
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="ລາຍຮັບລວມ" value={`₭${(reportData.summary?.totalRevenue || 0).toLocaleString()}`} color="blue" />
          <StatCard title="ບໍລິສັດ" value={`₭${(reportData.summary?.companyShare || 0).toLocaleString()}`} color="green" />
          <StatCard title="ສະຖານີ" value={`₭${(reportData.summary?.stationShare || 0).toLocaleString()}`} color="purple" />
          <StatCard title="ຄົນຂັບ" value={`₭${(reportData.summary?.driverShare || 0).toLocaleString()}`} color="orange" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ການແບ່ງລາຍຮັບ</h3>
            <div className="h-48">
              <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດ</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <div>
                  <p className="font-medium text-blue-900">ບໍລິສັດ (10%)</p>
                  <p className="text-sm text-blue-600">{breakdown.company?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-blue-600">₭{(breakdown.company?.totalAmount || 0).toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div>
                  <p className="font-medium text-green-900">ສະຖານີ (5%)</p>
                  <p className="text-sm text-green-600">{breakdown.station?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-green-600">₭{(breakdown.station?.totalAmount || 0).toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <div>
                  <p className="font-medium text-orange-900">ຄົນຂັບ (85%)</p>
                  <p className="text-sm text-orange-600">{breakdown.driver?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-orange-600">₭{(breakdown.driver?.totalAmount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render based on report type
  switch (reportType) {
    case 'summary': 
      return renderSummaryReport();
    case 'sales': 
      return renderSalesReport();
    case 'drivers': 
      return renderDriverReport();
    case 'financial': 
      return renderFinancialReport();
    case 'vehicles': 
      return <VehiclesReportComponent reportData={reportData} loading={loading} />;
    case 'staff': 
      return <StaffReportComponent reportData={reportData} loading={loading} />;
    default: 
      return <div>ປະເພດບົດລາຍງານບໍ່ຖືກຕ້ອງ</div>;
  }
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
}> = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200'
  };

  const textClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-3 text-center`}>
      {icon && <div className={`${textClasses[color as keyof typeof textClasses]} mb-2`}>{icon}</div>}
      <p className={`text-xl font-bold ${textClasses[color as keyof typeof textClasses]}`}>{value}</p>
      <p className={`text-sm ${textClasses[color as keyof typeof textClasses]}`}>{title}</p>
    </div>
  );
};

export default ReportContent;