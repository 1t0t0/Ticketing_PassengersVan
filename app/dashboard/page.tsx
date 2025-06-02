// app/dashboard/page.tsx - Reduced & Layout Consistent
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
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  totalDrivers: number;
  totalStaff: number;
  checkedInDrivers: number;
  checkedInStaff: number;
  hourlyTickets: Array<{ _id: number; count: number; revenue: number }>;
  paymentMethodStats: { cash: number; qr: number };
}

const MiniPaymentChart = ({ cashPercentage, qrPercentage }: { cashPercentage: number; qrPercentage: number }) => (
  <div className="relative w-16 h-16">
    <div 
      className="w-16 h-16 rounded-full"
      style={{ 
        background: `conic-gradient(#3B82F6 0deg ${cashPercentage * 3.6}deg, #10B981 ${cashPercentage * 3.6}deg 360deg)`,
        mask: 'radial-gradient(circle, transparent 60%, black 60%)',
        WebkitMask: 'radial-gradient(circle, transparent 60%, black 60%)'
      }}
    />
  </div>
);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalDrivers: 0,
    totalStaff: 0,
    checkedInDrivers: 0,
    checkedInStaff: 0,
    hourlyTickets: [],
    paymentMethodStats: { cash: 65, qr: 35 }
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
    else fetchDashboardData();
  }, [session, status, router, startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
      notificationService.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  
  const hourlyData = {
    labels: hourlyLabels,
    datasets: [{
      label: 'Tickets Sold',
      data: hourlyLabels.map((_, hour) => {
        const found = stats.hourlyTickets.find(h => h._id === hour);
        return found ? found.count : 0;
      }),
      borderColor: '#1E90FF',
      backgroundColor: 'rgba(30, 144, 255, 0.5)',
      tension: 0.4,
      pointRadius: 3,
      fill: false
    }]
  };

  const StatCard = ({ title, value, subtitle, progressPercent, progressColor }: {
    title: string;
    value: string | number;
    subtitle?: string;
    progressPercent?: number;
    progressColor?: string;
  }) => (
    <NeoCard className="p-4">
      <h3 className="text-sm font-bold text-gray-500 uppercase">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
      {progressPercent !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full ${progressColor || 'bg-blue-600'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </NeoCard>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 ໜ້າຫຼັກ</h1>
            <p className="text-gray-600">ພາບລວມຂໍ້ມູນສະຖິຕິ ແລະ ການດຳເນີນງານປະຈຳວັນ</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md p-2 text-sm"
            />
            <span>ຮອດ</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md p-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard title="ຈຳນວນປີ້" value={stats.totalTicketsSold} />
        <StatCard title="ຈຳນວນລາຍຮັບ" value={`₭${stats.totalRevenue.toLocaleString()}`} />
        
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

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <StatCard 
          title="ພະນັກງານຂັບລົດ" 
          value={stats.totalDrivers}
          subtitle={`${stats.checkedInDrivers} ຄົນທີ່ເຂົ້າວຽກ`}
          progressPercent={stats.totalDrivers > 0 ? (stats.checkedInDrivers / stats.totalDrivers) * 100 : 0}
          progressColor="bg-blue-600"
        />
        
        <StatCard 
          title="ພະນັກງານຂາຍປີ້" 
          value={stats.totalStaff}
          subtitle={`${stats.checkedInStaff} ຄົນທີ່ເຂົ້າວຽກ`}
          progressPercent={stats.totalStaff > 0 ? (stats.checkedInStaff / stats.totalStaff) * 100 : 0}
          progressColor="bg-green-600"
        />
      </div>

      {/* Hourly Chart */}
      <NeoCard className="p-4">
        <h3 className="text-lg font-bold mb-2">ຊົວໂມງການຂາຍ</h3>
        <p className="text-sm text-gray-500 mb-4">ຍອດການຂາຍປີ້ຕໍ່ຊົວໂມງ (ມື້ນີ້)</p>
        <div className="h-80">
          <Line 
            data={hourlyData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', align: 'start' },
                tooltip: { mode: 'index', intersect: false }
              },
              scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } }
              }
            }} 
          />
        </div>
      </NeoCard>
    </div>
  );
}