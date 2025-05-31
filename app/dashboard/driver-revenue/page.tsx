// app/dashboard/driver-revenue/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import { 
  FiDollarSign, 
  FiUsers, 
  FiCalendar,
  FiTrendingUp,
  FiRefreshCw,
  FiCheck,
  FiClock,
  FiUser,
  FiBarChart
} from 'react-icons/fi';

interface DriverRevenueData {
  driverId: string;
  driver: {
    _id: string;
    name: string;
    employeeId: string;
    checkInStatus: string;
  };
  totalIncome: number;
  ticketCount: number;
  averageShare: number;
  workingDriversCount: number;
}

interface DailyRevenueSummary {
  company: { totalAmount: number; transactionCount: number };
  station: { totalAmount: number; transactionCount: number };
  driver: { totalAmount: number; transactionCount: number };
}

export default function DriverRevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [driversRevenue, setDriversRevenue] = useState<DriverRevenueData[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<DailyRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [distributingRevenue, setDistributingRevenue] = useState(false);

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, router, session]);

  // ดึงข้อมูลรายได้
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchRevenueData();
    }
  }, [status, session, selectedDate]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      console.log('Fetching revenue data for date:', selectedDate);

      // ดึงรายได้ของคนขับทุกคน
      const driversResponse = await fetch(`/api/driver-revenue?type=daily&date=${selectedDate}`);
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        console.log('Drivers revenue data:', driversData);
        setDriversRevenue(driversData.data || []);
      }

      // ดึงสรุปรายได้รายวัน
      const summaryResponse = await fetch(`/api/driver-revenue?type=summary&date=${selectedDate}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        console.log('Revenue summary:', summaryData);
        setRevenueSummary(summaryData.data);
      }

    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeRevenue = async () => {
    try {
      setDistributingRevenue(true);
      
      // ดึงรายการรายได้ที่ยังไม่ได้แบ่งจ่าย
      const undistributedResponse = await fetch(`/api/driver-revenue?type=undistributed&date=${selectedDate}`);
      if (!undistributedResponse.ok) {
        throw new Error('Failed to fetch undistributed revenue');
      }
      
      const undistributedData = await undistributedResponse.json();
      const incomeIds = undistributedData.data.map((income: any) => income._id);
      
      if (incomeIds.length === 0) {
        alert('ไม่มีรายได้ที่ต้องแบ่งจ่าย');
        return;
      }
      
      // อัพเดทสถานะการแบ่งจ่าย
      const distributeResponse = await fetch('/api/driver-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_distributed',
          incomeIds: incomeIds
        })
      });
      
      if (!distributeResponse.ok) {
        throw new Error('Failed to distribute revenue');
      }
      
      const result = await distributeResponse.json();
      alert(`แบ่งจ่ายรายได้สำเร็จ: ${result.modifiedCount} รายการ`);
      
      // รีเฟรชข้อมูล
      fetchRevenueData();
      
    } catch (error) {
      console.error('Error distributing revenue:', error);
      alert('เกิดข้อผิดพลาดในการแบ่งจ่ายรายได้');
    } finally {
      setDistributingRevenue(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH').format(amount);
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

  if (status === 'unauthenticated' || !['admin', 'staff'].includes(session?.user?.role || '')) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ລາຍຮັບຄົນຂັບລົດ</h1>
          <p className="text-gray-600 mt-1">ລະບົບແບ່งລາຍຮັບຄົນຂັບລົດຕາມຜົນງານ</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-gray-500" size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
          <NeoButton
            onClick={fetchRevenueData}
            disabled={loading}
            className="flex items-center"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
            ອັບເດດ
          </NeoButton>
          <NeoButton
            onClick={handleDistributeRevenue}
            disabled={distributingRevenue || !driversRevenue.length}
            variant="success"
            className="flex items-center"
          >
            <FiCheck className={`mr-2 ${distributingRevenue ? 'animate-spin' : ''}`} size={16} />
            {distributingRevenue ? 'ກຳລັງແບ່ງຈ່າຍ...' : 'ແບ່ງຈ່າຍລາຍຮັບ'}
          </NeoButton>
        </div>
      </div>

      {/* Summary Cards */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <FiDollarSign className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ລາຍຮັບບໍລິສັດ (10%)</p>
                <p className="text-2xl font-bold">₭{formatCurrency(revenueSummary.company.totalAmount)}</p>
                <p className="text-xs text-gray-500">{revenueSummary.company.transactionCount} ລາຍການ</p>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg mr-4">
                <FiBarChart className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ລາຍຮັບສະຖານີ (5%)</p>
                <p className="text-2xl font-bold">₭{formatCurrency(revenueSummary.station.totalAmount)}</p>
                <p className="text-xs text-gray-500">{revenueSummary.station.transactionCount} ລາຍການ</p>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FiUsers className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ລາຍຮັບຄົນຂັບ (85%)</p>
                <p className="text-2xl font-bold">₭{formatCurrency(revenueSummary.driver.totalAmount)}</p>
                <p className="text-xs text-gray-500">{revenueSummary.driver.transactionCount} ລາຍການ</p>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <FiTrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ຄົນຂັບທີ່ເຮັດວຽກ</p>
                <p className="text-2xl font-bold">{driversRevenue.length}</p>
                <p className="text-xs text-gray-500">ຄົນ</p>
              </div>
            </div>
          </NeoCard>
        </div>
      )}

      {/* Drivers Revenue Table */}
      <NeoCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ລາຍຮັບຄົນຂັບແຕ່ລະຄົນ</h2>
          <span className="text-sm text-gray-500">
            ວັນທີ: {new Date(selectedDate).toLocaleDateString('lo-LA')}
          </span>
        </div>

        {driversRevenue.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">ບໍ່ມີຄົນຂັບເຂົ້າທຳງານໃນວັນນີ້</p>
            <p className="text-gray-400 text-sm mt-2">ລາຍຮັບຈະຖືກແບ່ງໃຫ້ຄົນຂັບທີ່ມີສະຖານະ "ເຂົ້າວຽກແລ້ວ" ເທົ່ານັ້ນ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-left font-medium text-gray-600">ຄົນຂັບ</th>
                  <th className="p-3 text-center font-medium text-gray-600">ສະຖານະ</th>
                  <th className="p-3 text-right font-medium text-gray-600">ຈຳນວນປີ້</th>
                  <th className="p-3 text-right font-medium text-gray-600">ລາຍຮັບທີ່ໄດ້ຮັບ</th>
                  <th className="p-3 text-right font-medium text-gray-600">ເຄິ່ງລາຍຮັບຕໍ່ປີ້</th>
                  <th className="p-3 text-center font-medium text-gray-600">ການແບ່ງຈາກ</th>
                </tr>
              </thead>
              <tbody>
                {driversRevenue.map((driverData, index) => (
                  <tr key={driverData.driverId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FiUser className="text-blue-500" size={16} />
                        </div>
                        <div>
                          <div className="font-medium">{driverData.driver.name}</div>
                          <div className="text-sm text-gray-500">ID: {driverData.driver.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        driverData.driver.checkInStatus === 'checked-in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {driverData.driver.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">{driverData.ticketCount}</td>
                    <td className="p-3 text-right">
                      <span className="text-lg font-bold text-green-600">
                        ₭{formatCurrency(driverData.totalIncome)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm text-gray-600">
                        ₭{formatCurrency(Math.round(driverData.averageShare || 0))}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm text-gray-500">
                        {driverData.workingDriversCount} ຄົນ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="p-3 font-bold">ລວມທັງໝົດ</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-bold">
                    {driversRevenue.reduce((sum, d) => sum + d.ticketCount, 0)}
                  </td>
                  <td className="p-3 text-right font-bold text-green-600">
                    ₭{formatCurrency(driversRevenue.reduce((sum, d) => sum + d.totalIncome, 0))}
                  </td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </NeoCard>

      {/* Info Card */}
      <NeoCard className="p-6 mt-6">
        <div className="flex items-start">
          <FiClock className="text-blue-500 mr-3 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">ວິທີການຄິດໄລ່ລາຍຮັບ</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>ບໍລິສັດ:</strong> ໄດ້ຮັບ 10% ຈາກລາຍຮັບທັງໝົດ</p>
              <p>• <strong>ສະຖານີ:</strong> ໄດ້ຮັບ 5% ຈາກລາຍຮັບທັງໝົດ</p>
              <p>• <strong>ຄົນຂັບ:</strong> ແບ່ງກັນ 85% ຈາກລາຍຮັບທັງໝົດ ຕາມຈຳນວນຄົນທີ່ເຂົ້າວຽກໃນວັນນັ້ນ</p>
              <p>• ຄົນຂັບທີ່ບໍ່ໄດ້ເຂົ້າວຽກ (Check-in) ຈະບໍ່ໄດ້ຮັບສ່ວນແບ່ງລາຍຮັບ</p>
            </div>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}