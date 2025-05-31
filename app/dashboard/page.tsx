'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { Line } from 'react-chartjs-2';
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
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
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

// Mini Donut Chart Component
const MiniPaymentChart = ({ cashPercentage, qrPercentage }: { cashPercentage: number; qrPercentage: number }) => {
  const data = {
    datasets: [{
      data: [cashPercentage, qrPercentage],
      backgroundColor: ['#3B82F6', '#10B981'], // Blue for cash, Green for QR
      borderWidth: 0,
      cutout: '60%',
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  return (
    <div className="relative w-16 h-16">
      <div style={{ position: 'relative', height: '64px', width: '64px' }}>
        {/* Using canvas directly since we can't import Doughnut */}
        <canvas 
          width="64" 
          height="64"
          style={{ 
            background: `conic-gradient(#3B82F6 0deg ${cashPercentage * 3.6}deg, #10B981 ${cashPercentage * 3.6}deg 360deg)`,
            borderRadius: '50%',
            mask: 'radial-gradient(circle, transparent 60%, black 60%)',
            WebkitMask: 'radial-gradient(circle, transparent 60%, black 60%)'
          }}
        />
      </div>
    </div>
  );
};

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
          <span>ຮອດ</span>
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
          <h3 className="text-sm font-bold text-gray-500 uppercase">ຈຳນວນປີ້</h3>
          <p className="text-2xl font-bold">{stats.totalTicketsSold}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">ຈຳນວນລາຍຮັບ</h3>
          <p className="text-2xl font-bold">₭{stats.totalRevenue.toLocaleString()}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">ປະເພດການຊຳລະ</h3>
          <div className="flex items-center justify-between mt-2">
            <div className="text-center">
              <div className="text-sm text-gray-500">ເງິນສົດ</div>
              <p className="font-bold text-blue-600">{stats.paymentMethodStats.cash}%</p>
            </div>
            <MiniPaymentChart 
              cashPercentage={stats.paymentMethodStats.cash} 
              qrPercentage={stats.paymentMethodStats.qr} 
            />
            <div className="text-center">
              <div className="text-sm text-gray-500">ເງິນໂອນ</div>
              <p className="font-bold text-green-600">{stats.paymentMethodStats.qr}%</p>
            </div>
          </div>
        </NeoCard>
      </div>

      {/* Staff and Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">ຈຳນວນພະນັກງານຂັບລົດ</h3>
          <p className="text-2xl font-bold">{stats.totalDrivers}</p>
          <div className="text-sm text-gray-500 mt-1">
            {stats.checkedInDrivers} ຄົນທີ່ເຂົ້າວຽກ
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
          <h3 className="text-sm font-bold text-gray-500 uppercase">ຈຳນວນພະນັກງານຂາຍປີ້</h3>
          <p className="text-2xl font-bold">{stats.totalStaff}</p>
          <div className="text-sm text-gray-500 mt-1">
            {stats.checkedInStaff} ຄົນທີ່ເຂົ້າວຽກ
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
      </div>

      {/* Hourly Sales Chart - Full Width */}
      <div className="mb-6">
        <NeoCard className="p-4">
          <h3 className="text-lg font-bold mb-2">ຊົວໂມງການຂາຍ</h3>
          <p className="text-sm text-gray-500 mb-4">ຍອດການຂາຍປີ້ຕໍ່ຊົວໂມງ(ມື້ນີ້)</p>
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
    </div>
  );
}