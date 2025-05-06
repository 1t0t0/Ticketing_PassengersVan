'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import { signOut } from 'next-auth/react';


interface DriverIncome {
  date: string;
  income: number;
}

export default function DriverPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todayIncome, setTodayIncome] = useState(0);
  const [incomeHistory, setIncomeHistory] = useState<DriverIncome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'driver') {
      router.push('/dashboard');
      return;
    }
    
    // Fetch driver income data
    fetchDriverIncome();
  }, [session, status, router]);

  const fetchDriverIncome = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setTodayIncome(25000);
      setIncomeHistory([
        { date: '2024-03-10', income: 25000 },
        { date: '2024-03-09', income: 23000 },
        { date: '2024-03-08', income: 24000 },
      ]);
    } catch (error) {
      console.error('Error fetching driver income:', error);
    } finally {
      setLoading(false);
    }
  };

  // แสดง loading ขณะกำลังตรวจสอบ session
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neo-yellow flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  // ถ้าไม่มี session หรือ role ไม่ถูกต้อง
  if (!session || session.user.role !== 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-neo-yellow p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black">DRIVER PORTAL</h1>
          <NeoButton 
            variant="danger" 
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            LOGOUT
          </NeoButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <NeoCard className="p-6" color="green">
            <h2 className="text-xl font-black mb-2">TODAY INCOME</h2>
            <p className="text-4xl font-black">฿{todayIncome.toLocaleString()}</p>
          </NeoCard>

          <NeoCard className="p-6">
            <h2 className="text-xl font-black mb-2">DRIVER INFO</h2>
            <p className="font-bold">NAME: {session.user.name?.toUpperCase()}</p>
            <p className="font-bold">EMAIL: {session.user.email}</p>
          </NeoCard>
        </div>

        <NeoCard className="p-6">
          <h2 className="text-xl font-black mb-4">INCOME HISTORY</h2>
          <table className="neo-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>INCOME</th>
              </tr>
            </thead>
            <tbody>
              {incomeHistory.map((record) => (
                <tr key={record.date}>
                  <td>{record.date}</td>
                  <td>฿{record.income.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeoCard>
      </div>
    </div>
  );
}