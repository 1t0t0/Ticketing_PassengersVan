'use client';

import { useState, useEffect } from 'react';
import NeoCard from '@/components/ui/NotionCard';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function DailyReportPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [date]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/daily?date=${date}`);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'Tickets Sold',
      data: Array.from({ length: 24 }, (_, i) => report?.ticketsByHour[i] || 0),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">DAILY REPORT</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="neo-input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <NeoCard className="p-4">
          <h3 className="font-bold">TOTAL TICKETS</h3>
          <p className="text-2xl">{report?.totalTickets}</p>
        </NeoCard>
        <NeoCard className="p-4">
          <h3 className="font-bold">TOTAL REVENUE</h3>
          <p className="text-2xl">฿{report?.totalRevenue?.toLocaleString()}</p>
        </NeoCard>
        <NeoCard className="p-4">
          <h3 className="font-bold">DRIVERS WORKING</h3>
          <p className="text-2xl">{report?.driversWorking}</p>
        </NeoCard>
        <NeoCard className="p-4">
          <h3 className="font-bold">PER DRIVER INCOME</h3>
          <p className="text-2xl">฿{report?.revenueSharing?.perDriver?.toLocaleString()}</p>
        </NeoCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NeoCard className="p-6">
          <h2 className="text-xl font-bold mb-4">REVENUE SHARING</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Company (10%)</span>
              <span>฿{report?.revenueSharing?.company?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Station (20%)</span>
              <span>฿{report?.revenueSharing?.station?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Drivers (70%)</span>
              <span>฿{report?.revenueSharing?.drivers?.toLocaleString()}</span>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-6">
          <h2 className="text-xl font-bold mb-4">PAYMENT METHODS</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Cash</span>
              <span>{report?.paymentMethods?.cash}</span>
            </div>
            <div className="flex justify-between">
              <span>Card</span>
              <span>{report?.paymentMethods?.card}</span>
            </div>
            <div className="flex justify-between">
              <span>QR Code</span>
              <span>{report?.paymentMethods?.qr}</span>
            </div>
          </div>
        </NeoCard>
      </div>

      <NeoCard className="p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">HOURLY SALES</h2>
        <Line data={hourlyData} />
      </NeoCard>
    </div>
  );
}