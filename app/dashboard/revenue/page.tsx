'use client';

import { useState, useEffect } from 'react';
import NeoCard from '@/components/ui/NotionCard';

interface RevenueData {
  totalRevenue: number;
  parentCompanyShare: number;
  stationShare: number;
  driversShare: number;
  numberOfDrivers: number;
  perDriverIncome: number;
}

export default function RevenuePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, [selectedDate]);

  const fetchRevenueData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/revenue?date=${selectedDate}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch revenue data: ${response.status}`);
      }
      
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError('Failed to fetch revenue data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-xl font-bold">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">REVENUE REPORTS</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="neo-input"
        />
      </div>

      {error && (
        <NeoCard className="p-6 mb-6" color="pink">
          <p className="text-center font-bold">{error}</p>
        </NeoCard>
      )}

      {revenueData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NeoCard className="p-6" color="green">
            <h2 className="text-xl font-black mb-2">TOTAL REVENUE</h2>
            <p className="text-4xl font-black">₭{revenueData.totalRevenue.toLocaleString()}</p>
          </NeoCard>

          <NeoCard className="p-6" color="blue">
            <h2 className="text-xl font-black mb-2">PARENT COMPANY (10%)</h2>
            <p className="text-4xl font-black">₭{revenueData.parentCompanyShare.toLocaleString()}</p>
          </NeoCard>

          <NeoCard className="p-6" color="yellow">
            <h2 className="text-xl font-black mb-2">STATION (20%)</h2>
            <p className="text-4xl font-black">₭{revenueData.stationShare.toLocaleString()}</p>
          </NeoCard>

          <NeoCard className="p-6" color="pink">
            <h2 className="text-xl font-black mb-2">DRIVERS TOTAL (70%)</h2>
            <p className="text-4xl font-black">₭{revenueData.driversShare.toLocaleString()}</p>
          </NeoCard>

          <NeoCard className="p-6">
            <h2 className="text-xl font-black mb-2">ACTIVE DRIVERS</h2>
            <p className="text-4xl font-black">{revenueData.numberOfDrivers}</p>
          </NeoCard>

          <NeoCard className="p-6">
            <h2 className="text-xl font-black mb-2">PER DRIVER</h2>
            <p className="text-4xl font-black">₭{revenueData.perDriverIncome.toLocaleString()}</p>
          </NeoCard>
        </div>
      ) : (
        <NeoCard className="p-6">
          <p className="text-center">No revenue data for this date</p>
        </NeoCard>
      )}
    </div>
  );
}