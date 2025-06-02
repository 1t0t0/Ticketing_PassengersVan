// StatsCards.tsx - Reduced
import React from 'react';
import NeoCard from '@/components/ui/NotionCard';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <NeoCard key={i} className="p-4">
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
    { title: "TOTAL TICKETS", value: stats.totalTicketsSold, format: (v: number) => v.toString() },
    { title: "TOTAL REVENUE", value: stats.totalRevenue, format: (v: number) => `₭${v.toLocaleString()}` },
    { title: "TOTAL DRIVERS", value: stats.totalDrivers, format: (v: number) => v.toString() },
    { title: "CHECKED-IN", value: stats.checkedInDrivers, format: (v: number) => v.toString() }
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