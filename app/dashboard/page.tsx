'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { Line } from 'react-chartjs-2';
import PaymentMethodsChart from '@/components/PaymentMethodsChart';
import notificationService from '@/lib/notificationService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalDrivers: number;
  totalStaff: number;
  checkedInDrivers: number;
  checkedInStaff: number;
  hourlyTickets: Array<{ _id: number; count: number; revenue: number }>;
  paymentMethodStats: {
    cash: number;
    qr: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalDrivers: 0,
    totalStaff: 0,
    checkedInDrivers: 0,
    checkedInStaff: 0,
    hourlyTickets: [],
    paymentMethodStats: {
      cash: 65,
      qr: 35
    }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
    else fetchDashboardData();
  }, [session, status, router, startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats from API
      const statsResponse = await fetch(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`);
      const statsData = await statsResponse.json();
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      notificationService.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for hourly chart
  const hourlyLabels = Array.from({ length: 24 }, (_, i) => 
    i < 10 ? `0${i}:00` : `${i}:00`
  );
  
  const hourlyData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Tickets Sold',
        data: hourlyLabels.map((_, hour) => {
          const found = stats.hourlyTickets.find(h => h._id === hour);
          return found ? found.count : 0;
        }),
        borderColor: '#1E90FF',
        backgroundColor: 'rgba(30, 144, 255, 0.5)',
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#1E90FF',
        fill: false
      }
    ]
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">DASHBOARD</h1>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Tickets</h3>
          <p className="text-2xl font-bold">{stats.totalTicketsSold}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Revenue</h3>
          <p className="text-2xl font-bold">₭{stats.totalRevenue.toLocaleString()}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Payment Methods</h3>
          <div className="flex justify-between mt-2">
            <div className="text-center">
              <div className="text-sm text-gray-500">Cash</div>
              <p className="font-bold">{stats.paymentMethodStats.cash}%</p>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">QR</div>
              <p className="font-bold">{stats.paymentMethodStats.qr}%</p>
            </div>
          </div>
        </NeoCard>
      </div>

      {/* Staff and Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Drivers</h3>
          <p className="text-2xl font-bold">{stats.totalDrivers}</p>
          <div className="text-sm text-gray-500 mt-1">
            {stats.checkedInDrivers} drivers checked in
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ 
                width: `${stats.totalDrivers > 0 ? (stats.checkedInDrivers / stats.totalDrivers) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Staff</h3>
          <p className="text-2xl font-bold">{stats.totalStaff}</p>
          <div className="text-sm text-gray-500 mt-1">
            {stats.checkedInStaff} staff checked in
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ 
                width: `${stats.totalStaff > 0 ? (stats.checkedInStaff / stats.totalStaff) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </NeoCard>
        
        <NeoCard className="p-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Check-in Status</h3>
          <div className="flex flex-col md:flex-row justify-between mt-2 h-full">
            <div className="text-center flex flex-col items-center justify-center flex-1">
              <div className="text-blue-500 font-bold text-lg">{stats.checkedInDrivers}</div>
              <div className="text-sm">Drivers Checked-In</div>
              <div className="text-xs text-gray-500">
                {stats.totalDrivers > 0 
                  ? Math.round((stats.checkedInDrivers / stats.totalDrivers) * 100) 
                  : 0}% of total
              </div>
            </div>
            <div className="h-full w-px bg-gray-200 mx-2 hidden md:block"></div>
            <div className="text-center flex flex-col items-center justify-center flex-1">
              <div className="text-green-500 font-bold text-lg">{stats.checkedInStaff}</div>
              <div className="text-sm">Staff Checked-In</div>
              <div className="text-xs text-gray-500">
                {stats.totalStaff > 0 
                  ? Math.round((stats.checkedInStaff / stats.totalStaff) * 100) 
                  : 0}% of total
              </div>
            </div>
          </div>
        </NeoCard>
      </div>

      {/* Charts and Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <NeoCard className="p-4">
            <h3 className="text-lg font-bold mb-2">Hourly Sales</h3>
            <p className="text-sm text-gray-500 mb-4">Tickets Sold by Hour (Today)</p>
            <div className="h-80">
              <Line data={hourlyData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    align: 'start',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#f0f0f0',
                    },
                  }
                }
              }} />
            </div>
          </NeoCard>
        </div>

        {/* Right Column - Payment Methods */}
        <div className="space-y-6">
          <NeoCard className="p-4">
            <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
            <PaymentMethodsChart 
              cashPercentage={stats.paymentMethodStats.cash} 
              qrPercentage={stats.paymentMethodStats.qr} 
            />
          </NeoCard>
        </div>
      </div>
    </div>
  );
}