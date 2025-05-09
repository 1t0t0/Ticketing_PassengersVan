'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { Line } from 'react-chartjs-2';
import PaymentMethodsChart from '@/components/PaymentMethodsChart'; // นำเข้าคอมโพเนนต์ที่แก้ไขแล้ว
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import useConfirmation from '@/hooks/useConfirmation';
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
  checkedInDrivers: number;
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
    checkedInDrivers: 0,
    hourlyTickets: [],
    paymentMethodStats: {
      cash: 65,
      qr: 35
    }
  });
  
  

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
    else fetchDashboardData();
  }, [session, status, router, startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      
      
      // ดึงข้อมูลสถิติจาก API
      const statsResponse = await fetch(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`);
      const statsData = await statsResponse.json();
      
      // ดึงข้อมูลตั๋วล่าสุด
      const ticketsResponse = await fetch('/api/tickets');
      const ticketsData = await ticketsResponse.json();
      
      if (Array.isArray(ticketsData)) {
       
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      
    }
  };

  // เตรียมข้อมูลสำหรับกราฟแท่งรายชั่วโมง
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

  // ฟังก์ชันแสดงเวลา


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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Tickets</h3>
          <p className="text-2xl font-bold">{stats.totalTicketsSold}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Revenue</h3>
          <p className="text-2xl font-bold">₭{stats.totalRevenue.toLocaleString()}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Drivers</h3>
          <p className="text-2xl font-bold">{stats.totalDrivers}</p>
        </NeoCard>

        <NeoCard className="p-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Checked-in Drivers</h3>
          <p className="text-2xl font-bold">{stats.checkedInDrivers}</p>
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

        {/* Right Column - Recent Tickets and Payment Methods */}
        <div className="space-y-6">
          {/* Recent Tickets */}
        

          {/* Payment Methods */}
          <NeoCard className="p-4">
            <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
            {/* ใช้คอมโพเนนต์ PaymentMethodsChart ที่แก้ไขแล้ว */}
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