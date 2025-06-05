// app/driver-portal/work-history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FiClock, 
  FiCalendar, 
  FiLogIn, 
  FiLogOut,
  FiRefreshCw,
  FiBarChart,
} from 'react-icons/fi';

interface WorkLog {
  _id: string;
  action: 'check-in' | 'check-out';
  timestamp: string;
  date: string;
  formattedTime?: string;
  actionText?: string;
}

interface MonthlyStats {
  totalDays: number;
  dailyLogs: { [date: string]: WorkLog[] };
  logs: WorkLog[];
}

export default function WorkHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // States
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [dailyLogs, setDailyLogs] = useState<WorkLog[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState({
    daily: false,
    monthly: false
  });

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch daily work logs
  const fetchDailyLogs = async (date: string) => {
    try {
      setLoading(prev => ({ ...prev, daily: true }));
      const response = await fetch(`/api/work-logs/user/${session?.user?.id}?type=daily&date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setDailyLogs(data);
      }
    } catch (error) {
      console.error('Error fetching daily logs:', error);
    } finally {
      setLoading(prev => ({ ...prev, daily: false }));
    }
  };

  // Fetch monthly stats
  const fetchMonthlyStats = async (yearMonth: string) => {
    try {
      setLoading(prev => ({ ...prev, monthly: true }));
      const [year, month] = yearMonth.split('-');
      const response = await fetch(`/api/work-logs/user/${session?.user?.id}?type=monthly&year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyStats(data);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  };

  // Initial load
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver' && session?.user?.id) {
      fetchDailyLogs(selectedDate);
      fetchMonthlyStats(selectedMonth);
    }
  }, [status, session]);

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchDailyLogs(date);
  };

  // Handle month change
  const handleMonthChange = (yearMonth: string) => {
    setSelectedMonth(yearMonth);
    fetchMonthlyStats(yearMonth);
  };

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('lo-LA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    return action === 'check-in' ? 
      <FiLogIn className="text-green-500" size={20} /> : 
      <FiLogOut className="text-red-500" size={20} />;
  };

  // Get action text
  const getActionText = (action: string) => {
    return action === 'check-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ';
  };

  // Get action background color
  const getActionBgColor = (action: string) => {
    return action === 'check-in' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  if (status === 'loading') {
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
              <h1 className="text-2xl font-bold text-gray-900">ປະຫວັດການເຮັດວຽກ</h1>
              <p className="text-gray-600">ບັນທຶກການເຂົ້າ-ອອກວຽກຂອງຕົນເອງ</p>
            </div>
            <button
              onClick={() => {
                fetchDailyLogs(selectedDate);
                fetchMonthlyStats(selectedMonth);
              }}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FiRefreshCw className="mr-2" size={16} />
              ອັບເດດ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiCalendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ວັນທຳງານໃນເດືອນ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading.monthly ? '...' : (monthlyStats?.totalDays || 0)} ວັນ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiBarChart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ຈຳນວນການບັນທຶກ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading.monthly ? '...' : (monthlyStats?.logs.length || 0)} ຄັ້ງ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiClock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ວັນນີ້</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading.daily ? '...' : dailyLogs.length} ຄັ້ງ
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Logs */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">ບັນທຶກລາຍວັນ</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="p-6">
              {loading.daily ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : dailyLogs.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dailyLogs.map((log) => (
                    <div key={log._id} className={`p-4 rounded-lg border ${getActionBgColor(log.action)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getActionIcon(log.action)}
                          <div>
                            <div className="font-medium text-gray-900">{getActionText(log.action)}</div>
                            <div className="text-sm text-gray-600">{formatTime(log.timestamp)}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleDateString('lo-LA')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiClock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">ບໍ່ມີບັນທຶກໃນວັນນີ້</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Calendar */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">ສັງລວມລາຍເດືອນ</h2>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="p-6">
              {loading.monthly ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : monthlyStats && Object.keys(monthlyStats.dailyLogs).length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(monthlyStats.dailyLogs).map(([date, logs]) => (
                    <div key={date} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          {new Date(date + 'T12:00:00').toLocaleDateString('lo-LA')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {logs.length} ການບັນທຶກ
                        </span>
                      </div>
                      <div className="space-y-1">
                        {logs.map((log) => (
                          <div key={log._id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(log.action)}
                              <span>{getActionText(log.action)}</span>
                            </div>
                            <span className="text-gray-600">{formatTime(log.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCalendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">ບໍ່ມີບັນທຶກໃນເດືອນນີ້</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiClock className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-blue-900">ຂໍ້ມູນສຳຄັນ</h3>
          </div>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• ບັນທຶກການເຂົ້າ-ອອກວຽກຈະຖືກບັນທຶກອັດຕະໂນມັດເມື່ອກົດປຸ່ມ Check-in/Check-out</p>
            <p>• ຂໍ້ມູນການເຮັດວຽກຈະຖືກນຳໄປຄິດໄລ່ລາຍຮັບປະຈຳວັນ</p>
            <p>• ຄົນຂັບທີ່ບໍ່ເຂົ້າວຽກຈະບໍ່ໄດ້ຮັບສ່ວນແບ່ງລາຍຮັບໃນວັນນັ້ນ</p>
            <p>• ຫາກມີຂໍ້ຜິດພາດກ່ຽວກັບການບັນທຶກ ກະລຸນາຕິດຕໍ່ຜູ້ບໍລິຫານ</p>
          </div>
        </div>
      </div>
    </div>
  );
}