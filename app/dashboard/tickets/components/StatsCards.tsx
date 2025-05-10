import React from 'react';
import NeoCard from '@/components/ui/NotionCard';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

/**
 * คอมโพเนนต์แสดงการ์ดสถิติสำหรับหน้า Ticket Sales
 */
const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <NeoCard key={index} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </NeoCard>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "TOTAL TICKETS",
      value: stats.totalTicketsSold,
      format: (value: number) => value.toString()
    },
    {
      title: "TOTAL REVENUE",
      value: stats.totalRevenue,
      format: (value: number) => `₭${value.toLocaleString()}`
    },
    {
      title: "TOTAL DRIVERS",
      value: stats.totalDrivers,
      format: (value: number) => value.toString()
    },
    {
      title: "CHECKED-IN",
      value: stats.checkedInDrivers,
      format: (value: number) => value.toString()
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <NeoCard key={index} className="p-4">
          <h3 className="text-xs text-gray-600 uppercase font-medium mb-1">{card.title}</h3>
          <p className="text-2xl font-bold">{card.format(card.value)}</p>
        </NeoCard>
      ))}
    </div>
  );
};

export default StatsCards;