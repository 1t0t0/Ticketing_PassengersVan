'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';

interface IncomeData {
  date: string;
  income: number;
  totalRevenue: number;
  numberOfDrivers: number;
  ticketsSold: number;
}

export default function DriverIncomePage() {
  const router = useRouter();
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [incomeHistory, setIncomeHistory] = useState<IncomeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ตรวจสอบว่าเข้าสู่ระบบแล้วหรือไม่
    const token = localStorage.getItem('driverToken');
    const info = localStorage.getItem('driverInfo');
    
    if (!token || !info) {
      router.push('/driver-login');
      return;
    }
    
    setDriverInfo(JSON.parse(info));
    fetchIncomeHistory();
  }, [router]);

  const fetchIncomeHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('driverToken');
      
      if (!token) {
        router.push('/driver-login');
        return;
      }
      
      const response = await fetch('/api/driver-income/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch income data');
      }
      
      const data = await response.json();
      setIncomeHistory(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch income data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverInfo');
    router.push('/driver-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neo-yellow">
        <p className="text-xl font-bold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neo-yellow p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black">DRIVER INCOME</h1>
          <NeoButton onClick={handleLogout} variant="danger">LOGOUT</NeoButton>
        </div>

        {error && (
          <NeoCard className="p-4 mb-6 bg-neo-pink">
            <p className="text-center font-bold">{error}</p>
          </NeoCard>
        )}

        <NeoCard className="p-6 mb-6">
          <h2 className="text-xl font-black mb-4">DRIVER INFO</h2>
          {driverInfo && (
            <div className="space-y-2">
              <p className="font-bold">NAME: {driverInfo.name}</p>
              <p className="font-bold">EMPLOYEE ID: {driverInfo.employeeId}</p>
              <p className="font-bold">EMAIL: {driverInfo.email}</p>
            </div>
          )}
        </NeoCard>

        <NeoCard className="p-6">
          <h2 className="text-xl font-black mb-4">INCOME HISTORY</h2>
          
          {incomeHistory.length === 0 ? (
            <p className="text-center py-4">No income records found</p>
          ) : (
            <table className="w-full">
              <thead className="bg-neo-blue">
                <tr>
                  <th className="p-2 text-left">DATE</th>
                  <th className="p-2 text-left">INCOME</th>
                  <th className="p-2 text-left">TOTAL REVENUE</th>
                  <th className="p-2 text-left">DRIVERS</th>
                  <th className="p-2 text-left">TICKETS SOLD</th>
                </tr>
              </thead>
              <tbody>
                {incomeHistory.map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-2">฿{record.income.toLocaleString()}</td>
                    <td className="p-2">฿{record.totalRevenue.toLocaleString()}</td>
                    <td className="p-2">{record.numberOfDrivers}</td>
                    <td className="p-2">{record.ticketsSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </NeoCard>
      </div>
    </div>
  );
}