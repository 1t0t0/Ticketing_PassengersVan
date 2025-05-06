'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotionCard from '@/components/ui/NotionCard';
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
  totalDrivers: number;
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
    totalDrivers: 0,
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#6B6B6B]">Loading...</p>
      </div>
    );
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
        borderColor: '#2383E2',
        backgroundColor: 'rgba(35, 131, 226, 0.1)',
        tension: 0.3,
        fill: true
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
        backgroundColor: 'rgba(35, 131, 226, 0.8)',
        borderRadius: 3
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-[#37352F]">Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'day' | 'month' | 'year')}
          className="text-sm border border-[#E9E9E8] rounded-sm px-3 py-1.5 bg-white focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2]"
        >
          <option value="day">Today</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <NotionCard className="p-5">
          <div className="space-y-1">
            <p className="text-xs text-[#6B6B6B] uppercase">Total Tickets</p>
            <p className="text-2xl font-medium text-[#37352F]">{stats.totalTicketsSold}</p>
          </div>
        </NotionCard>

        <NotionCard className="p-5">
          <div className="space-y-1">
            <p className="text-xs text-[#6B6B6B] uppercase">Total Revenue</p>
            <p className="text-2xl font-medium text-[#37352F]">฿{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </NotionCard>

        <NotionCard className="p-5">
          <div className="space-y-1">
            <p className="text-xs text-[#6B6B6B] uppercase">Total Drivers</p>
            <p className="text-2xl font-medium text-[#37352F]">{stats.totalDrivers}</p>
          </div>
        </NotionCard>

        <NotionCard className="p-5">
          <div className="space-y-1">
            <p className="text-xs text-[#6B6B6B] uppercase">Checked-in Drivers</p>
            <p className="text-2xl font-medium text-[#37352F]">{stats.checkedInDrivers}</p>
          </div>
        </NotionCard>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Chart */}
        <NotionCard className="p-6">
          <h2 className="text-base font-medium text-[#37352F] mb-4">Hourly Sales</h2>
          <div className="h-64">
            <Line data={hourlyData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    boxWidth: 10,
                    font: {
                      size: 12
                    }
                  }
                },
                title: {
                  display: true,
                  text: 'Tickets Sold by Hour (Today)',
                  font: {
                    size: 13,
                    weight: '500'
                  }
                }
              },
              scales: {
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      size: 10
                    }
                  }
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '#f0f0f0'
                  },
                  ticks: {
                    font: {
                      size: 10
                    }
                  }
                }
              }
            }} />
          </div>
        </NotionCard>

        {/* Daily Revenue Chart */}
        <NotionCard className="p-6">
          <h2 className="text-base font-medium text-[#37352F] mb-4">7-Day Revenue</h2>
          <div className="h-64">
            <Bar data={dailyData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                  labels: {
                    boxWidth: 10,
                    font: {
                      size: 12
                    }
                  }
                },
                title: {
                  display: true,
                  text: 'Daily Revenue (Last 7 Days)',
                  font: {
                    size: 13,
                    weight: '500'
                  }
                }
              },
              scales: {
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      size: 10
                    }
                  }
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '#f0f0f0'
                  },
                  ticks: {
                    font: {
                      size: 10
                    }
                  }
                }
              }
            }} />
          </div>
        </NotionCard>
      </div>
    </div>
  );
}