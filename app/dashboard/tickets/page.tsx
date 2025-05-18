// app/dashboard/tickets/page.tsx (ปรับปรุง)
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// คอมโพเนนต์
import NeoCard from '@/components/ui/NotionCard';
import { StatsCards, TicketSalesForm, RecentTicketsList } from './components';
import PrintableTickets from './components/PrintableTickets';

// Hooks
import useTicketSales from './hooks/useTicketSales';
import useTicketStats from './hooks/useTicketStats';

export default function TicketSalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // นำเข้า custom hooks
  const { 
    ticketPrice, 
    paymentMethod, 
    ticketQuantity,
    setPaymentMethod,
    setTicketQuantity,
    lastTickets, 
    sellTicket, 
    loading, 
    printRef,
  } = useTicketSales();
  
  const { stats, recentTickets, loading: statsLoading, fetchData } = useTicketStats();

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // ดึงข้อมูลเมื่อเข้าสู่ระบบสำเร็จ
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ຫນ້າການອອກປີ້</h1>
      
      {/* แสดงการ์ดสถิติ */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* เนื้อหาหลัก */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ส่วนขายตั๋ว */}
        <NeoCard className="p-6">
          <h2 className="text-lg font-bold mb-6">ດຳເນີນການອອກປີ້</h2>
          
          <TicketSalesForm
            ticketPrice={ticketPrice}
            paymentMethod={paymentMethod}
            ticketQuantity={ticketQuantity}
            setPaymentMethod={setPaymentMethod}
            setTicketQuantity={setTicketQuantity}
            onSellTicket={sellTicket}
            loading={loading}
          />
        </NeoCard>

        {/* ส่วนแสดงตั๋วล่าสุด */}
        <NeoCard className="p-6">
          <h2 className="text-lg font-bold mb-4">ປີ້ທີ່ອອກລ່າສຸດ</h2>
          
          <RecentTicketsList 
            tickets={recentTickets} 
            onViewAllClick={() => router.push('/dashboard/tickets/history')} 
          />
        </NeoCard>
      </div>

      {/* ส่วนซ่อนสำหรับการพิมพ์ตั๋ว */}
      <div ref={printRef} className="hidden">
        {lastTickets && lastTickets.length > 0 && (
          <PrintableTickets tickets={lastTickets} />
        )}
      </div>
    </div>
  );
}