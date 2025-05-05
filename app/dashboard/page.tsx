// app/dashboard/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NeoButton from '@/components/ui/NeoButton';
import NeoCard from '@/components/ui/NeoCard';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  activeDrivers: number;
  checkedInDrivers: number;
  dailyTickets: Array<{ _id: string; count: number; revenue: number }>;
  hourlyTickets: Array<{ _id: number; count: number; revenue: number }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    checkedInDrivers: 0,
    dailyTickets: [],
    hourlyTickets: [],
  });
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
    else fetchDashboardStats();
  }, [session, status, router, period]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?period=${period}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Prepare hourly chart data
  const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourlyData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Tickets Sold',
        data: hourlyLabels.map((_, hour) => {
          const found = stats.hourlyTickets.find(h => h._id === hour);
          return found ? found.count : 0;
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      }
    ]
  };

  // Prepare daily chart data
  const dailyData = {
    labels: stats.dailyTickets.map(d => d._id),
    datasets: [
      {
        label: 'Revenue (฿)',
        data: stats.dailyTickets.map(d => d.revenue),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="min-h-screen bg-neo-yellow">
      <nav className="bg-neo-blue border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-black">BUS TICKET SYSTEM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-bold">WELCOME, {session?.user?.name?.toUpperCase()}</span>
              <NeoButton variant="danger" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
                LOGOUT
              </NeoButton>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <NeoCard className="p-5" color="blue">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-bold">TOTAL TICKETS</h3>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'day' | 'month' | 'year')}
                className="text-xs border-2 border-black p-1"
              >
                <option value="day">Today</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <p className="text-3xl font-black">{stats.totalTicketsSold}</p>
          </NeoCard>

          <NeoCard className="p-5" color="green">
            <h3 className="text-sm font-bold mb-1">TOTAL REVENUE</h3>
            <p className="text-3xl font-black">฿{stats.totalRevenue.toLocaleString()}</p>
          </NeoCard>

          <NeoCard className="p-5" color="pink">
            <h3 className="text-sm font-bold mb-1">ACTIVE DRIVERS</h3>
            <p className="text-3xl font-black">{stats.activeDrivers}</p>
          </NeoCard>

          <NeoCard className="p-5" color="white">
            <h3 className="text-sm font-bold mb-1">CHECKED-IN</h3>
            <p className="text-3xl font-black">{stats.checkedInDrivers}</p>
          </NeoCard>
        </div>

        {/* Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Sales Chart */}
          <NeoCard className="p-6">
            <h2 className="text-xl font-black mb-4">HOURLY SALES</h2>
            <Line data={hourlyData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Tickets Sold by Hour (Today)'
                }
              }
            }} />
          </NeoCard>

          {/* Daily Revenue Chart */}
          <NeoCard className="p-6">
            <h2 className="text-xl font-black mb-4">7-DAY REVENUE</h2>
            <Bar data={dailyData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Daily Revenue (Last 7 Days)'
                }
              }
            }} />
          </NeoCard>
        </div>

        {/* Recent Activity Table */}
        <NeoCard className="p-6 mt-6">
          <h2 className="text-xl font-black mb-4">RECENT TICKETS</h2>
          <RecentTicketsTable />
        </NeoCard>
      </main>
    </div>
  );
}

// Component สำหรับแสดงตารางตั๋วล่าสุด
function RecentTicketsTable() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetch('/api/tickets')
      .then(res => res.json())
      .then(data => setTickets(data.slice(0, 10)));
  }, []);

  return (
    <table className="neo-table">
      <thead>
        <tr>
          <th>TICKET NUMBER</th>
          <th>PRICE</th>
          <th>PAYMENT METHOD</th>
          <th>SOLD AT</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket: any) => (
          <tr key={ticket._id}>
            <td>{ticket.ticketNumber}</td>
            <td>฿{ticket.price.toLocaleString()}</td>
            <td>{ticket.paymentMethod.toUpperCase()}</td>
            <td>{new Date(ticket.soldAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}