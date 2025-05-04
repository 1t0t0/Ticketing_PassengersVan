// app/driver-portal/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NeoCard from '@/components/ui/NeoCard';
import NeoButton from '@/components/ui/NeoButton';

interface DriverIncome {
  date: string;
  income: number;
  totalRevenue: number;
  numberOfDrivers: number;
  ticketsSold: number;
}

export default function DriverPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todayIncome, setTodayIncome] = useState(0);
  const [incomeHistory, setIncomeHistory] = useState<DriverIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    } else if (session.user.role !== 'driver') {
      router.push('/dashboard');
    } else if (session.user.driverId) {
      fetchDriverIncome();
    }
  }, [session, status, router]);

  const fetchDriverIncome = async () => {
    if (!session?.user?.driverId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch today's income
      const todayResponse = await fetch(`/api/drivers/${session.user.driverId}/income`);
      if (!todayResponse.ok) throw new Error('Failed to fetch today\'s income');
      const todayData = await todayResponse.json();
      setTodayIncome(todayData.income);

      // Fetch income history
      const historyResponse = await fetch(`/api/drivers/${session.user.driverId}/income-history`);
      if (!historyResponse.ok) throw new Error('Failed to fetch income history');
      const historyData = await historyResponse.json();
      setIncomeHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neo-yellow flex items-center justify-center">
        <div className="text-xl font-bold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neo-yellow p-4">
        <div className="max-w-4xl mx-auto">
          <NeoCard className="p-6 bg-red-100">
            <h2 className="text-xl font-black mb-2">ERROR</h2>
            <p>{error}</p>
            <NeoButton className="mt-4" onClick={fetchDriverIncome}>
              TRY AGAIN
            </NeoButton>
          </NeoCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neo-yellow p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black">DRIVER PORTAL</h1>
          <NeoButton variant="danger" onClick={() => signOut({ callbackUrl: '/login' })}>
            LOGOUT
          </NeoButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <NeoCard className="p-6" color="green">
            <h2 className="text-xl font-black mb-2">TODAYS INCOME</h2>
            <p className="text-4xl font-black">฿{todayIncome.toLocaleString()}</p>
            <p className="text-sm mt-2">
              {new Date().toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </NeoCard>

          <NeoCard className="p-6">
            <h2 className="text-xl font-black mb-2">DRIVER INFO</h2>
            <p className="font-bold">NAME: {session?.user?.name?.toUpperCase()}</p>
            <p className="font-bold">EMAIL: {session?.user?.email}</p>
            <p className="font-bold">DRIVER ID: {session?.user?.driverId}</p>
          </NeoCard>
        </div>

        <NeoCard className="p-6">
          <h2 className="text-xl font-black mb-4">INCOME HISTORY</h2>
          {incomeHistory.length > 0 ? (
            <table className="neo-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>INCOME</th>
                  <th>TICKETS SOLD</th>
                  <th>TOTAL DRIVERS</th>
                </tr>
              </thead>
              <tbody>
                {incomeHistory.map((record) => (
                  <tr key={record.date}>
                    <td>
                      {new Date(record.date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>฿{record.income.toLocaleString()}</td>
                    <td>{record.ticketsSold}</td>
                    <td>{record.numberOfDrivers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-600">No income history available</p>
          )}
        </NeoCard>
      </div>
    </div>
  );
}