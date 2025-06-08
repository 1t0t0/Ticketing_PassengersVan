// app/dashboard/reports/components/ReportContent.tsx - ปรับปรุงให้มี Pagination

import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiUsers, FiBarChart, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
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
import Pagination from '@/components/ui/Pagination';

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
  // States สำหรับ Pagination
  const [driverPage, setDriverPage] = useState(1);
  const [carPage, setCarPage] = useState(1);
  const [staffPage, setStaffPage] = useState(1);
  
  const ITEMS_PER_PAGE = 5;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
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
        <div 
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#CBD5E1 #F1F5F9',
            paddingBottom: '8px'
          }}
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            if (!target.dataset.scrollbarStyled) {
              const style = document.createElement('style');
              style.textContent = `
                .custom-scrollbar::-webkit-scrollbar {
                  height: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #F1F5F9;
                  border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #CBD5E1;
                  border-radius: 6px;
                  border: 2px solid #F1F5F9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #94A3B8;
                }
              `;
              document.head.appendChild(style);
              target.classList.add('custom-scrollbar');
              target.dataset.scrollbarStyled = 'true';
            }
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[600px]">
            <StatCard icon={<FiCreditCard />} title="ປີ້ທີ່ຂາຍ" value={stats.totalTickets || 0} color="blue" />
            <StatCard icon={<FiDollarSign />} title="ລາຍຮັບລວມ" value={`₭${(stats.totalRevenue || 0).toLocaleString()}`} color="green" />
            <StatCard icon={<FiUsers />} title="ພະນັກງານຂັບລົດເຂົ້າວຽກ" value={stats.activeDrivers || 0} color="blue" />
            <StatCard icon={<FiBarChart />} title="ລາຄາເຊລີ່ຍ" value={`₭${(stats.avgTicketPrice || 0).toLocaleString()}`} color="gray" />
          </div>
        </div>

        <div 
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#CBD5E1 #F1F5F9',
            paddingBottom: '8px'
          }}
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            if (!target.dataset.scrollbarStyled) {
              const style = document.createElement('style');
              style.textContent = `
                .custom-scrollbar::-webkit-scrollbar {
                  height: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #F1F5F9;
                  border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #CBD5E1;
                  border-radius: 6px;
                  border: 2px solid #F1F5F9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #94A3B8;
                }
              `;
              document.head.appendChild(style);
              target.classList.add('custom-scrollbar');
              target.dataset.scrollbarStyled = 'true';
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[600px]">
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
              <h3 className="text-lg font-semibold mb-3">ພະນັກງານຂັບລົດ</h3>
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
                  <span>ສ່ວນແບ່ງພະນັກງານຂັບລົດ:</span>
                  <span className="font-semibold">₭{(reportData.financial?.driverShare || 0).toLocaleString()}</span>
                </div>
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
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
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
                <p className="text-xl font-bold text-gray-700">₭{(reportData.summary?.averagePrice || 0).toLocaleString()}</p>
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
      return <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນພະນັກງານຂັບລົດ</div>;
    }

    const summary = reportData.summary || {};
    const metadata = reportData.metadata || {};
    const drivers = reportData.drivers || [];
    
    // Pagination logic
    const totalDrivers = drivers.length;
    const totalPages = Math.ceil(totalDrivers / ITEMS_PER_PAGE);
    const startIndex = (driverPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentDrivers = drivers.slice(startIndex, endIndex);

    return (
      <div className="space-y-4">
        <div 
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#CBD5E1 #F1F5F9',
            paddingBottom: '8px'
          }}
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            if (!target.dataset.scrollbarStyled) {
              const style = document.createElement('style');
              style.textContent = `
                .custom-scrollbar::-webkit-scrollbar {
                  height: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #F1F5F9;
                  border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #CBD5E1;
                  border-radius: 6px;
                  border: 2px solid #F1F5F9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #94A3B8;
                }
              `;
              document.head.appendChild(style);
              target.classList.add('custom-scrollbar');
              target.dataset.scrollbarStyled = 'true';
            }
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[600px]">
            <StatCard title="ພະນັກງານຂັບລົດທັງໝົດ" value={summary.totalDrivers || 0} color="blue" />
            <StatCard title="ພະນັກງານຂັບລົດທີ່ທຳງານ" value={summary.workingDriversInPeriod || 0} color="green" />
            <StatCard title="ວັນທຳວຽກລວມ" value={summary.totalWorkDays || 0} color="gray" />
            <StatCard title="ລາຍຮັບຕໍ່ຄົນ" value={`₭${(metadata.revenuePerDriver || 0).toLocaleString()}`} color="green" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">ລາຍລະອຽດພະນັກງານຂັບລົດ</h3>
            <span className="text-sm text-gray-500">
              ສະແດງ {startIndex + 1}-{Math.min(endIndex, totalDrivers)} ຈາກ {totalDrivers} ຄົນ
            </span>
          </div>
          
          {totalDrivers === 0 ? (
            <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນພະນັກງານຂັບລົດທີ່ມີລາຍຮັບໃນຊ່ວງເວລານີ້</div>
          ) : (
            <>
              <div 
                className="overflow-x-auto"
                style={{
                  scrollbarWidth: 'auto',
                  scrollbarColor: '#CBD5E1 #F1F5F9',
                  paddingBottom: '8px'
                }}
                onScroll={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.dataset.scrollbarStyled) {
                    const style = document.createElement('style');
                    style.textContent = `
                      .custom-scrollbar::-webkit-scrollbar {
                        height: 12px;
                      }
                      .custom-scrollbar::-webkit-scrollbar-track {
                        background: #F1F5F9;
                        border-radius: 6px;
                      }
                      .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #CBD5E1;
                        border-radius: 6px;
                        border: 2px solid #F1F5F9;
                      }
                      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #94A3B8;
                      }
                    `;
                    document.head.appendChild(style);
                    target.classList.add('custom-scrollbar');
                    target.dataset.scrollbarStyled = 'true';
                  }
                }}
              >
                <div className="min-w-full">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2 whitespace-nowrap">#</th>
                        <th className="text-left p-2 whitespace-nowrap">ຊື່</th>
                        <th className="text-left p-2 whitespace-nowrap">ລະຫັດ</th>
                        <th className="text-center p-2 whitespace-nowrap">ສະຖານະ</th>
                        <th className="text-center p-2 whitespace-nowrap">ວັນທຳງານ</th>
                        <th className="text-right p-2 whitespace-nowrap">ລາຍຮັບ (KIP)</th>
                        <th className="text-center p-2 whitespace-nowrap">ເຂົ້າວຽກ</th>
                        <th className="text-center p-2 whitespace-nowrap">ອອກວຽກ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDrivers.map((driver: any, index: number) => (
                        <tr key={driver.id || startIndex + index} className="border-b">
                          <td className="p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                          <td className="p-2 font-medium whitespace-nowrap">{driver.name || 'N/A'}</td>
                          <td className="p-2 text-gray-600 whitespace-nowrap">{driver.employeeId || 'N/A'}</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              driver.performance === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {driver.performance === 'Active' ? 'ເຂົ້າວຽກ' : 'ບໍ່ເຂົ້າວຽກ'}
                            </span>
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">{driver.workDays || 0}</td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <span className={`font-bold ${(driver.totalIncome || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              ₭{(driver.totalIncome || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-2 text-center text-sm text-gray-600 whitespace-nowrap">
                            {driver.lastCheckIn 
                              ? new Date(driver.lastCheckIn).toLocaleDateString('lo-LA') + ' ' +
                                new Date(driver.lastCheckIn).toLocaleTimeString('lo-LA', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : '-'
                            }
                          </td>
                          <td className="p-2 text-center text-sm text-gray-600 whitespace-nowrap">
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
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={driverPage}
                totalPages={totalPages}
                onPageChange={setDriverPage}
                className="mt-4"
              />
            </>
          )}
          
          {/* เพิ่มข้อความอธิบาย */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 flex items-start">
              <FiInfo className="mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>ໝາຍເຫດ:</strong> ຂໍ້ມູນທີ່ສະແດງເປັນຂໍ້ມູນໃນຊ່ວງເວລາທີ່ເລືອກເທົ່ານັ້ນ 
                (ເຂົ້າ-ອອກວຽກແມ່ນຄັ້ງລ່າສຸດໃນຊ່ວງເວລານັ້ນ)
              </span>
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
      labels: ['ບໍລິສັດ (10%)', 'ສະຖານີ (5%)', 'ພະນັກງານຂັບລົດ (85%)'],
      datasets: [{
        data: [
          breakdown.company?.totalAmount || 0,
          breakdown.station?.totalAmount || 0,
          breakdown.driver?.totalAmount || 0
        ],
        backgroundColor: ['#3B82F6', '#9CA3AF', '#10B981'],
      }]
    };

    return (
      <div className="space-y-4">
        <div 
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#CBD5E1 #F1F5F9',
            paddingBottom: '8px'
          }}
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            if (!target.dataset.scrollbarStyled) {
              const style = document.createElement('style');
              style.textContent = `
                .custom-scrollbar::-webkit-scrollbar {
                  height: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #F1F5F9;
                  border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #CBD5E1;
                  border-radius: 6px;
                  border: 2px solid #F1F5F9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #94A3B8;
                }
              `;
              document.head.appendChild(style);
              target.classList.add('custom-scrollbar');
              target.dataset.scrollbarStyled = 'true';
            }
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[600px]">
            <StatCard title="ລາຍຮັບລວມ" value={`₭${(reportData.summary?.totalRevenue || 0).toLocaleString()}`} color="green" />
            <StatCard title="ບໍລິສັດ" value={`₭${(reportData.summary?.companyShare || 0).toLocaleString()}`} color="blue" />
            <StatCard title="ສະຖານີ" value={`₭${(reportData.summary?.stationShare || 0).toLocaleString()}`} color="blue" />
            <StatCard title="ພະນັກງານຂັບລົດ" value={`₭${(reportData.summary?.driverShare || 0).toLocaleString()}`} color="green" />
          </div>
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
                <p className="font-bold text-blue-700">₭{(breakdown.company?.totalAmount || 0).toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">ສະຖານີ (5%)</p>
                  <p className="text-sm text-gray-600">{breakdown.station?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-gray-700">₭{(breakdown.station?.totalAmount || 0).toLocaleString()}</p>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div>
                  <p className="font-medium text-green-900">ພະນັກງານຂັບລົດ (85%)</p>
                  <p className="text-sm text-green-600">{breakdown.driver?.transactionCount || 0} ລາຍການ</p>
                </div>
                <p className="font-bold text-green-700">₭{(breakdown.driver?.totalAmount || 0).toLocaleString()}</p>
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
      return <VehiclesReportComponent reportData={reportData} loading={loading} carPage={carPage} setCarPage={setCarPage} />;
    case 'staff': 
      return <StaffReportComponent reportData={reportData} loading={loading} staffPage={staffPage} setStaffPage={setStaffPage} />;
    default: 
      return <div>ປະເພດບົດລາຍງານບໍ່ຖືກຕ້ອງ</div>;
  }
};

// StatCard Component - เพิ่มสีให้ส่วนสำคัญ
const StatCard: React.FC<{
  title: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
}> = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  const textClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600'
  };

  const valueClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    gray: 'text-gray-800'
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-3 text-center`}>
      {icon && <div className={`${textClasses[color as keyof typeof textClasses]} mb-2 flex justify-center`}>{icon}</div>}
      <p className={`text-xl font-bold ${valueClasses[color as keyof typeof valueClasses]}`}>{value}</p>
      <p className={`text-sm ${textClasses[color as keyof typeof textClasses]}`}>{title}</p>
    </div>
  );
};

export default ReportContent;