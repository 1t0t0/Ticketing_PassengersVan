// app/dashboard/reports/components/ReportContent.tsx - เพิ่มการแสดงข้อมูลตั๋วแบบกลุ่ม

import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiUsers, FiBarChart, FiCheck, FiX, FiInfo, FiUser } from 'react-icons/fi';
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

  // ✅ ฟังก์ชันสำหรับแสดงรายงานสรุปพร้อมข้อมูลตั๋วกลุ่ม
  const renderSummaryReport = () => {
    const stats = reportData.quickStats || {};
    const sales = reportData.sales || {};
    const ticketBreakdown = sales.ticketBreakdown || {};

    // ✅ ข้อมูลสำหรับ chart แสดงสัดส่วนตั๋วแบบบุคคล vs กลุ่ม
    const ticketTypeChartData = {
      labels: ['ປີ້ບຸກຄົນ', 'ປີ້ກະລຸ່ມ'],
      datasets: [{
        data: [
          ticketBreakdown.individual?.count || 0,
          ticketBreakdown.group?.count || 0
        ],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    return (
      <div className="space-y-4">
        {/* ✅ สถิติหลักที่เพิ่มข้อมูลผู้โดยสาร */}
        <div 
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#CBD5E1 #F1F5F9',
            paddingBottom: '8px'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 min-w-[800px]">
            <StatCard icon={<FiCreditCard />} title="ປີ້ທີ່ຂາຍ" value={stats.totalTickets || 0} color="blue" />
            <StatCard icon={<FiUser />} title="ຜູ້ໂດຍສານລວມ" value={stats.totalPassengers || 0} color="green" />
            <StatCard icon={<FiDollarSign />} title="ລາຍຮັບລວມ" value={`₭${(stats.totalRevenue || 0).toLocaleString()}`} color="green" />
            <StatCard icon={<FiUsers />} title="ພະນັກງານຂັບລົດເຂົ້າວຽກ" value={stats.activeDrivers || 0} color="blue" />
            <StatCard icon={<FiBarChart />} title="ລາຄາເຊລີ່ຍ/ໃບ" value={`₭${(stats.avgTicketPrice || 0).toLocaleString()}`} color="gray" />
          </div>
        </div>

        {/* ✅ ส่วนแสดงข้อมูลตั๋วแยกประเภท */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* การแจกแยงประเภทตั๋ว */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FiCreditCard className="mr-2" />
              ການແຈກແຍງປະເພດປີ້
            </h3>
            
            {(ticketBreakdown.individual?.count || 0) + (ticketBreakdown.group?.count || 0) > 0 ? (
              <div className="h-48">
                <Doughnut 
                  data={ticketTypeChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} ໃບ (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນປີ້</div>
            )}
          </div>

          {/* ✅ สถิติรายละเอียดตั๋ว */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດປີ້</h3>
            <div className="space-y-4">
              {/* ปี้บุคคล */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-blue-800 flex items-center">
                    <FiUser className="mr-2" />
                    ປີ້ບຸກຄົນ
                  </h4>
                  <span className="text-blue-600 font-bold">
                    {ticketBreakdown.individual?.percentage || 0}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-600">ຈຳນວນ:</span>
                    <span className="font-bold ml-1">{ticketBreakdown.individual?.count || 0} ໃບ</span>
                  </div>
                  <div>
                    <span className="text-blue-600">ຜູ້ໂດຍສານ:</span>
                    <span className="font-bold ml-1">{ticketBreakdown.individual?.passengers || 0} ຄົນ</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-600">ລາຍຮັບ:</span>
                    <span className="font-bold ml-1">₭{(ticketBreakdown.individual?.revenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ปี้กลุ่ม */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <FiUsers className="mr-2" />
                    ປີ້ກະລຸ່ມ
                  </h4>
                  <span className="text-green-600 font-bold">
                    {ticketBreakdown.group?.percentage || 0}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-green-600">ຈຳນວນ:</span>
                    <span className="font-bold ml-1">{ticketBreakdown.group?.count || 0} ໃບ</span>
                  </div>
                  <div>
                    <span className="text-green-600">ຜູ້ໂດຍສານ:</span>
                    <span className="font-bold ml-1">{ticketBreakdown.group?.passengers || 0} ຄົນ</span>
                  </div>
                  <div>
                    <span className="text-green-600">ເຊລີ່ຍ/ກະລຸ່ມ:</span>
                    <span className="font-bold ml-1">{ticketBreakdown.group?.averageGroupSize || 0} ຄົນ</span>
                  </div>
                  <div>
                    <span className="text-green-600">ລາຍຮັບ:</span>
                    <span className="font-bold ml-1">₭{(ticketBreakdown.group?.revenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ✅ สรุปรวม */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">{stats.totalTickets || 0}</div>
                    <div className="text-xs text-gray-600">ປີ້ທັງໝົດ</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{stats.totalPassengers || 0}</div>
                    <div className="text-xs text-gray-600">ຜູ້ໂດຍສານ</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      ₭{(stats.avgPricePerPassenger || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">ລາຄາ/ຄົນ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนสรุปรายงานแบบเดิม */}
        <div 
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#CBD5E1 #F1F5F9',
            paddingBottom: '8px'
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
                  <span>ຜູ້ໂດຍສານລວມ:</span>
                  <span className="font-semibold">{reportData.sales?.totalPassengers || 0}</span>
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

        {/* ✅ เพิ่มหมายเหตุเกี่ยวกับตั๋วกลุ่ม */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FiInfo className="text-blue-600 mr-2 mt-1 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">ຂໍ້ມູນປີ້ກະລຸ່ມ:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>ປີ້ກະລຸ່ມ 1 ໃບ ສາມາດມີຜູ້ໂດຍສານ 2-10 ຄົນ</li>
                <li>ລາຄາປີ້ກະລຸ່ມ = ລາຄາຕໍ່ຄົນ × ຈຳນວນຜູ້ໂດຍສານ</li>
                <li>ການນັບຍອດຂາຍແມ່ນນັບຕາມຈຳນວນໃບປີ້ ບໍ່ແມ່ນຈຳນວນຜູ້ໂດຍສານ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ฟังก์ชันอื่นๆ เหมือนเดิม (renderSalesReport, renderDriverReport, etc.)
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

  // ... (เก็บฟังก์ชันอื่นๆ เหมือนเดิม)

  // Render based on report type
  switch (reportType) {
    case 'summary': 
      return renderSummaryReport();
    case 'sales': 
      return renderSalesReport();
    // ... (cases อื่นๆ เหมือนเดิม)
    default: 
      return <div>ປະເພດບົດລາຍງານບໍ່ຖືກຕ້ອງ</div>;
  }
};

// StatCard Component - เหมือนเดิม
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