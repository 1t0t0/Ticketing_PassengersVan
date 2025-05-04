'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NeoButton from '@/components/ui/NeoButton';
import NeoCard from '@/components/ui/NeoCard';

interface DashboardStats {
  totalTicketsSold: number;
  totalRevenue: number;
  activeDrivers: number;
  checkedInDrivers: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalTicketsSold: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    checkedInDrivers: 0,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
    else fetchDashboardStats();
  }, [session, status, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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
            <h3 className="text-sm font-bold mb-1">TOTAL TICKETS</h3>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NeoCard className="p-6">
            <h3 className="text-lg font-black mb-2">TICKET SALES</h3>
            <p className="text-sm mb-4">Manage ticket sales and issue new tickets.</p>
            <NeoButton onClick={() => router.push('/dashboard/tickets')}>
              GO TO TICKETS
            </NeoButton>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-black mb-2">DRIVER MANAGEMENT</h3>
            <p className="text-sm mb-4">Manage drivers and check-in/check-out.</p>
            <NeoButton onClick={() => router.push('/dashboard/drivers')}>
              MANAGE DRIVERS
            </NeoButton>
          </NeoCard>

          <NeoCard className="p-6">
            <h3 className="text-lg font-black mb-2">REVENUE REPORTS</h3>
            <p className="text-sm mb-4">View revenue reports and distribution.</p>
            <NeoButton onClick={() => router.push('/dashboard/revenue')}>
              VIEW REPORTS
            </NeoButton>
          </NeoCard>
        </div>
      </main>
    </div>
  );
}