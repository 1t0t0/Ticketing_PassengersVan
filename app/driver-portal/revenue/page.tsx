// app/driver-portal/revenue/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { 
  FiDollarSign, 
  FiCalendar,
  FiTrendingUp,
  FiRefreshCw,
  FiBarChart,
  FiUsers
} from 'react-icons/fi';

interface PersonalRevenueData {
  totalIncome: number;
  ticketCount: number;
  averageShare: number;
  workingDriversCount: number;
  driver?: {
    _id: string;
    name: string;
    employeeId: string;
    checkInStatus: string;
  };
}

interface MonthlyRevenueData {
  _id: { year: number; month: number; day: number };
  date: string;
  totalIncome: number;
  ticketCount: number;
  workingDriversCount: number;
}

export default function DriverPersonalRevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [dailyRevenue, setDailyRevenue] = useState<PersonalRevenueData | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, router, session]);

  // ดึงข้อมูลรายได้รายวัน
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver') {
      fetchDailyRevenue();
    }
  }, [status, session, selectedDate]);

  // ดึงข้อมูลรายได้รายเดือน
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver') {
      fetchMonthlyRevenue();
    }
  }, [status, session, selectedMonth]);

  const fetchDailyRevenue = async () => {
    try {
      setLoading(true);
      console.log('Fetching daily revenue for driver:', session?.user?.id);

      const response = await fetch(`/api/driver-revenue?type=daily&date=${selectedDate}&driverId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Daily revenue data:', data);
        setDailyRevenue(data.data);
      } else {
        console.error('Failed to fetch daily revenue');
        setDailyRevenue(null);
      }

    } catch (error) {
      console.error('Error fetching daily revenue:', error);
      setDailyRevenue(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      setMonthlyLoading(true);
      const [year, month] = selectedMonth.split('-');
      console.log('Fetching monthly revenue for:', { year, month });

      const response = await fetch(`/api/driver-revenue?type=monthly&year=${year}&month=${month}&driverId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Monthly revenue data:', data);
        setMonthlyRevenue(data.data || []);
      } else {
        console.error('Failed to fetch monthly revenue');
        setMonthlyRevenue([]);
      }

    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      setMonthlyRevenue([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('lo-LA', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // คำนวณสถิติรายเดือน
  const monthlyStats = monthlyRevenue.reduce((acc, day) => {
    acc.totalIncome += day.totalIncome;
    acc.totalTickets += day.ticketCount;
    acc.workingDays += 1;
    return acc;
  }, { totalIncome: 0, totalTickets: 0, workingDays: 0 });

  const averageDailyIncome = monthlyStats.workingDays > 0 
    ? monthlyStats.totalIncome / monthlyStats.workingDays 
    : 0;

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

  if (status === 'unauthenticated' || session?.user?.role !== 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">ລາຍຮັບສ່ວນຕົວ</h1>
            <p className="text-gray-600 mt-1">ຕິດຕາມລາຍຮັບການເຮັດວຽກຂອງທ່ານ</p>
          </div>
          <div className="flex items-center space-x-4">
            <NeoButton
              onClick={fetchDailyRevenue}
              disabled={loading}
              className="flex items-center"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
              ອັບເດດ
            </NeoButton>
          </div>
        </div>

        {/* Date Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <NeoCard className="p-4">
            <div className="flex items-center space-x-2">
              <FiCalendar className="text-gray-500" size={16} />
              <label className="text-sm font-medium text-gray-700">ເລືອກວັນທີ:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
          </NeoCard>

          <NeoCard className="p-4">
            <div className="flex items-center space-x-2">
              <FiBarChart className="text-gray-500" size={16} />
              <label className="text-sm font-medium text-gray-700">ເລືອກເດືອນ:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
          </NeoCard>
        </div>

        {/* Daily Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FiDollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ລາຍຮັບວັນນີ້</p>
                <p className="text-2xl font-bold">₭{formatCurrency(dailyRevenue?.totalIncome || 0)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(selectedDate).toLocaleDateString('lo-LA')}
                </p>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <FiBarChart className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ຈຳນວນປີ້</p>
                <p className="text-2xl font-bold">{dailyRevenue?.ticketCount || 0}</p>
                <p className="text-xs text-gray-500">ໃບ</p>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg mr-4">
                <FiTrendingUp className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ສ່ວນແບ່ງຕໍ່ປີ້</p>
                <p className="text-2xl font-bold">₭{formatCurrency(dailyRevenue?.averageShare || 0)}</p>
                <p className="text-xs text-gray-500">ຄ່າເຄິ່ງ</p>
              </div>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <FiUsers className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase font-medium">ຄົນຂັບທີ່ເຮັດວຽກ</p>
                <p className="text-2xl font-bold">{dailyRevenue?.workingDriversCount || 0}</p>
                <p className="text-xs text-gray-500">ຄົນ</p>
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <NeoCard className="p-6">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg inline-block mb-3">
                <FiDollarSign className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">ລາຍຮັບລວມປະຈຳເດືອນ</h3>
              <p className="text-3xl font-bold text-green-600">₭{formatCurrency(monthlyStats.totalIncome)}</p>
              <p className="text-sm text-gray-500 mt-1">{monthlyStats.totalTickets} ປີ້</p>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg inline-block mb-3">
                <FiCalendar className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">ວັນທີ່ເຮັດວຽກ</h3>
              <p className="text-3xl font-bold text-blue-600">{monthlyStats.workingDays}</p>
              <p className="text-sm text-gray-500 mt-1">ວັນ</p>
            </div>
          </NeoCard>

          <NeoCard className="p-6">
            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-lg inline-block mb-3">
                <FiTrendingUp className="text-orange-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">ຄ່າເຄິ່ງຕໍ່ວັນ</h3>
              <p className="text-3xl font-bold text-orange-600">₭{formatCurrency(Math.round(averageDailyIncome))}</p>
              <p className="text-sm text-gray-500 mt-1">ຄ່າສະເລ່ຍ</p>
            </div>
          </NeoCard>
        </div>

        {/* Monthly Revenue Table */}
        <NeoCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">ລາຍຮັບປະຈຳເດືອນ</h2>
            <span className="text-sm text-gray-500">
              {selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('lo-LA', { year: 'numeric', month: 'long' }) : ''}
            </span>
          </div>

          {monthlyLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>ກຳລັງໂຫລດຂໍ້ມູນປະຈຳເດືອນ...</p>
            </div>
          ) : monthlyRevenue.length === 0 ? (
            <div className="text-center py-12">
              <FiBarChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">ບໍ່ມີຂໍ້ມູນລາຍຮັບໃນເດືອນນີ້</p>
              <p className="text-gray-400 text-sm mt-2">ລາຍຮັບຈະສະແດງເມື່ອທ່ານເຂົ້າວຽກແລະມີການຂາຍປີ້</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-3 text-left font-medium text-gray-600">ວັນທີ</th>
                    <th className="p-3 text-right font-medium text-gray-600">ຈຳນວນປີ້</th>
                    <th className="p-3 text-right font-medium text-gray-600">ລາຍຮັບ</th>
                    <th className="p-3 text-center font-medium text-gray-600">ຄົນຂັບທີ່ເຮັດວຽກ</th>
                    <th className="p-3 text-right font-medium text-gray-600">ສ່ວນແບ່ງຕໍ່ຄົນ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRevenue.map((day, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">
                          {day._id.day}/{day._id.month}/{day._id.year}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(day.date).toLocaleDateString('lo-LA', { weekday: 'long' })}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{day.ticketCount}</td>
                      <td className="p-3 text-right">
                        <span className="text-lg font-bold text-green-600">
                          ₭{formatCurrency(day.totalIncome)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm text-gray-600">
                          {day.workingDriversCount} ຄົນ
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm text-gray-600">
                          ₭{formatCurrency(day.workingDriversCount > 0 ? Math.round(day.totalIncome / day.workingDriversCount) : 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-300">
                    <td className="p-3 font-bold">ລວມທັງໝົດ</td>
                    <td className="p-3 text-right font-bold">{monthlyStats.totalTickets}</td>
                    <td className="p-3 text-right font-bold text-green-600">
                      ₭{formatCurrency(monthlyStats.totalIncome)}
                    </td>
                    <td className="p-3 text-center font-bold">{monthlyStats.workingDays} ວັນ</td>
                    <td className="p-3 text-right font-bold">
                      ₭{formatCurrency(Math.round(averageDailyIncome))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </NeoCard>

        {/* Info Card */}
        <NeoCard className="p-6 mt-6">
          <div className="flex items-start">
            <FiDollarSign className="text-green-500 mr-3 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">ຂໍ້ມູນການຄິດໄລ່ລາຍຮັບ</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• ທ່ານຈະໄດ້ຮັບສ່ວນແບ່ງ <strong>85%</strong> ຈາກລາຍຮັບການຂາຍປີ້ທັງໝົດ</p>
                <p>• ສ່ວນແບ່ງຈະຖືກແບ່ງໃຫ້ຄົນຂັບທີ່ເຂົ້າວຽກ (Check-in) ໃນວັນນັ້ນເທົ່ານັ້ນ</p>
                <p>• ຈຳນວນເງິນທີ່ທ່ານໄດ້ຮັບ = (ລາຍຮັບທັງໝົດ × 85%) ÷ ຈຳນວນຄົນຂັບທີ່ເຂົ້າວຽກ</p>
                <p>• ຂໍ້ມູນລາຍຮັບຈະອັບເດດແບບ Real-time ທຸກຄັ້ງທີ່ມີການຂາຍປີ້</p>
              </div>
            </div>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}