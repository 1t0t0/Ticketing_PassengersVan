// app/dashboard/reports/components/ReportContent.tsx - แก้ไขให้แสดงรายงานทุกประเภท

import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiUsers, FiBarChart, FiCheck, FiX, FiInfo, FiUser, FiTruck, FiUserCheck } from 'react-icons/fi';
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

// Import components
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

    // ข้อมูลสำหรับ chart แสดงสัดส่วนตั๋วแบบบุคคล vs กลุ่ม
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
        {/* สถิติหลัก */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 min-w-[800px]">
            <StatCard icon={<FiCreditCard />} title="ປີ້ທີ່ຂາຍ" value={stats.totalTickets || 0} color="blue" />
            <StatCard icon={<FiUser />} title="ຜູ້ໂດຍສານລວມ" value={stats.totalPassengers || 0} color="green" />
            <StatCard icon={<FiDollarSign />} title="ລາຍຮັບລວມ" value={`₭${(stats.totalRevenue || 0).toLocaleString()}`} color="green" />
            <StatCard icon={<FiUsers />} title="ພະນັກງານຂັບລົດເຂົ້າວຽກ" value={stats.activeDrivers || 0} color="blue" />
            <StatCard icon={<FiBarChart />} title="ລາຄາເຊລີ່ຍ/ໃບ" value={`₭${(stats.avgTicketPrice || 0).toLocaleString()}`} color="gray" />
          </div>
        </div>

        {/* ส่วนแสดงข้อมูลตั๋วแยกประเภท */}
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

          {/* สถิติรายละเอียดตั๋ว */}
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

              {/* สรุปรวม */}
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
        <div className="overflow-x-auto">
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

        {/* หมายเหตุเกี่ยวกับตั๋วกลุ่ม */}
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

  // ✅ รายงานยอดขาย
  const renderSalesReport = () => {
    if (!reportData?.paymentMethods) {
      return <div className="text-center py-8 text-gray-500">ບໍ່ມີຂໍ້ມູນຍອດຂາຍ</div>;
    }

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

 // แก้ไขในส่วน renderDriverReport ของไฟล์ ReportContent.tsx

const renderDriverReport = () => {
  const summary = reportData.summary || {};
  // ✅ แก้ไข: ตรวจสอบให้แน่ใจว่า drivers เป็น array
  const drivers = Array.isArray(reportData.drivers) ? reportData.drivers : [];
  
  console.log('🔍 Debug - renderDriverReport:', {
    reportData: reportData,
    drivers: drivers,
    driversType: typeof drivers,
    driversLength: drivers.length,
    isArray: Array.isArray(drivers)
  });
  
  // แยก drivers ที่มีสิทธิ์ กับ ไม่มีสิทธิ์
  const qualifiedDrivers = drivers.filter((d: any) => (d.totalIncome || 0) > 0);
  const nonQualifiedDrivers = drivers.filter((d: any) => (d.totalIncome || 0) === 0);
  
  // Pagination
  const totalDrivers = drivers.length;
  const totalPages = Math.ceil(totalDrivers / ITEMS_PER_PAGE);
  const startIndex = (driverPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDrivers = drivers.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* สถิติสรุป */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 min-w-[800px]">
          <StatCard icon={<FiUsers />} title="ທັງໝົດ" value={summary.totalDrivers || 0} color="blue" />
          <StatCard icon={<FiCheck />} title="ເຮັດວຽກ" value={summary.workingDriversInPeriod || 0} color="green" />
          <StatCard icon={<FiDollarSign />} title="ທີ່ຜ່ານຂັ້ນຕ່ຳແລ້ວ" value={qualifiedDrivers.length} color="green" />
          <StatCard icon={<FiX />} title="ບໍ່ຜ່ານຂັ້ນຕ່ຳ" value={nonQualifiedDrivers.length} color="gray" />
          <StatCard icon={<FiBarChart />} title="ລາຍໄດ້ສະເລ່ຍ" value={`₭${((reportData.metadata?.revenuePerDriver || 0)).toLocaleString()}`} color="blue" />
        </div>
      </div>

      {/* กล่องสรุปรายได้ */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-4">💰 ສະຫຼຸບລາຍຮັບພະນັກງານຂັບລົດ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">₭{(summary.totalIncome || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">ລາຍຮັບລວມ (85%)</div>
          </div>
          <div className="text-center bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-blue-600">{qualifiedDrivers.length}</div>
            <div className="text-sm text-gray-600">ທຳຄົບ 2 ຮອບ</div>
          </div>
          <div className="text-center bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-purple-600">₭{(reportData.metadata?.revenuePerDriver || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">ລາຍຮັບເຊລີ່ຍຕໍ່ຄົນ</div>
          </div>
          <div className="text-center bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-orange-600">{nonQualifiedDrivers.length}</div>
            <div className="text-sm text-gray-600">ບໍ່ມີສິທິ່ຮັບລາຍຮັບ</div>
          </div>
        </div>
      </div>

      {/* ตารางคนขับที่มีสิทธิ์ */}
      {qualifiedDrivers.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-green-700">
            ✅ ພະນັກງານຂັບລົດທີ່ມີສິທິ່ຮັບລາຍຮັບ ({qualifiedDrivers.length} ຄົນ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-green-50">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">ຊື່</th>
                  <th className="text-center p-2">ລະຫັດ</th>
                  <th className="text-center p-2">ວັນທຳງານ</th>
                  <th className="text-center p-2">ລາຍຮັບ</th>
                  <th className="text-center p-2">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody>
                {qualifiedDrivers.slice(0, 10).map((driver: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2 font-medium">{driver.name || 'ບໍ່ລະບຸ'}</td>
                    <td className="p-2 text-center">{driver.employeeId || '-'}</td>
                    <td className="p-2 text-center">{driver.workDays || 0}</td>
                    <td className="p-2 text-center font-bold text-green-600">
                      ₭{(driver.totalIncome || 0).toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        ມີສິທິ່ຮັບລາຍຮັບ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ตารางคนขับที่ไม่มีสิทธิ์ */}
      {nonQualifiedDrivers.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-red-700">
            ❌ ພະນັກງານຂັບລົດທີ່ບໍ່ມີສິທິ່ຮັບລາຍຮັບ ({nonQualifiedDrivers.length} ຄົນ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-red-50">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">ຊື່</th>
                  <th className="text-center p-2">ລະຫັດ</th>
                  <th className="text-center p-2">ວັນທຳງານ</th>
                  <th className="text-center p-2">ລາຍຮັບ</th>
                  <th className="text-center p-2">ສະຖານະ</th>
                </tr>
              </thead>
              <tbody>
                {nonQualifiedDrivers.slice(0, 10).map((driver: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2 font-medium">{driver.name || 'ບໍ່ລະບຸ'}</td>
                    <td className="p-2 text-center">{driver.employeeId || '-'}</td>
                    <td className="p-2 text-center">{driver.workDays || 0}</td>
                    <td className="p-2 text-center font-bold text-red-600">₭0</td>
                    <td className="p-2 text-center">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                        ບໍ່ມີສິທິ່
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* แสดงข้อความเมื่อไม่มีข้อมูล */}
      {drivers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">📋 ບໍ່ມີຂໍ້ມູນພະນັກງານຂັບລົດໃນຊ່ວງເວລານີ້</p>
        </div>
      )}

      {/* คำอธิบายเงื่อนไข */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FiInfo className="text-blue-600 mr-2 mt-1 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">ເງື່ອນໄຂການຮັບລາຍຮັບ:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>ຕ້ອງທຳການເດີນທາງຄົບ 2 ຮອບຕໍ່ວັນ</li>
              <li>ແຕ່ລະຮອບຕ້ອງມີຜູ້ໂດຍສານອັງນ້ອຍ 80% ຂອງຄວາມຈຸລົດ</li>
              <li>ລາຍຮັບທັງໝົດ 85% ຈະຖືກແບ່ງເທົ່າໆກັນລະຫວ່າງພະນັກງານຂັບລົດທີ່ມີສິທິ່</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

  // ✅ รายงานการเงิน
  const renderFinancialReport = () => {
    const summary = reportData.summary || {};
    const breakdown = reportData.breakdown || {};
    
    const chartData = {
      labels: ['ບໍລິສັດ (10%)', 'ສະຖານີ (5%)', 'ພະນັກງານຂັບລົດ (85%)'],
      datasets: [{
        data: [
          breakdown.company?.totalAmount || 0,
          breakdown.station?.totalAmount || 0,
          breakdown.driver?.totalAmount || 0
        ],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      }]
    };

    return (
      <div className="space-y-6">
        {/* สถิติสรุป */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[600px]">
            <StatCard 
              icon={<FiDollarSign />} 
              title="ລາຍຮັບລວມ" 
              value={`₭${(summary.totalRevenue || 0).toLocaleString()}`} 
              color="green" 
            />
            <StatCard 
              icon={<FiBarChart />} 
              title="ບໍລິສັດ (10%)" 
              value={`₭${(breakdown.company?.totalAmount || 0).toLocaleString()}`} 
              color="red" 
            />
            <StatCard 
              icon={<FiBarChart />} 
              title="ສະຖານີ (5%)" 
              value={`₭${(breakdown.station?.totalAmount || 0).toLocaleString()}`} 
              color="blue" 
            />
            <StatCard 
              icon={<FiUsers />} 
              title="ພະນັກງານຂັບລົດ (85%)" 
              value={`₭${(breakdown.driver?.totalAmount || 0).toLocaleString()}`} 
              color="green" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ການແບ່ງລາຍຮັບ</h3>
            <div className="h-64">
              <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* ตารางรายละเอียด */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">ລາຍລະອຽດການແບ່ງ</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">ປະເພດ</th>
                    <th className="text-center p-2">ເປີເຊັນ</th>
                    <th className="text-right p-2">ມູນຄ່າ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">🏢 ບໍລິສັດ</td>
                    <td className="p-2 text-center font-bold">10%</td>
                    <td className="p-2 text-right font-bold text-red-600">
                      ₭{(breakdown.company?.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">🚉 ສະຖານີ</td>
                    <td className="p-2 text-center font-bold">5%</td>
                    <td className="p-2 text-right font-bold text-blue-600">
                      ₭{(breakdown.station?.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">👥 ພະນັກງານຂັບລົດ</td>
                    <td className="p-2 text-center font-bold">85%</td>
                    <td className="p-2 text-right font-bold text-green-600">
                      ₭{(breakdown.driver?.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-2">📊 ລວມທັງໝົດ</td>
                    <td className="p-2 text-center">100%</td>
                    <td className="p-2 text-right">₭{(summary.totalRevenue || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
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
      return (
        <VehiclesReportComponent 
          reportData={reportData}
          loading={loading}
          carPage={carPage}
          setCarPage={setCarPage}
        />
      );
    case 'staff':
      return (
        <StaffReportComponent 
          reportData={reportData}
          loading={loading}
          staffPage={staffPage}
          setStaffPage={setStaffPage}
        />
      );
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
    gray: 'bg-gray-50 border-gray-200',
    red: 'bg-red-50 border-red-200'
  };

  const textClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600',
    red: 'text-red-600'
  };

  const valueClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    gray: 'text-gray-800',
    red: 'text-red-700'
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