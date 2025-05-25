// app/dashboard/tickets/page.tsx - ปรับ Layout ให้สมดุลระหว่าง 2 ส่วน
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// คอมโพเนนต์
import NeoCard from '@/components/ui/NotionCard';
import { StatsCards, TicketSalesForm, RecentTicketsList, PrintableTicket } from './components';
import TicketConfirmationModal from './components/TicketConfirmationModal';
import { FiRefreshCw } from 'react-icons/fi';

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
    setPaymentMethod, 
    createdTickets,
    showConfirmation,
    cancelConfirmation,
    confirmSellTicket,
    showConfirmModal,
    quantity,
    updateQuantity,
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

  // Auto Refresh Stats หลังจากขายตั๋วสำเร็จ
  useEffect(() => {
    if (createdTickets.length > 0) {
      const timer = setTimeout(() => {
        console.log('Auto refreshing stats after ticket sale...');
        fetchData();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [createdTickets, fetchData]);

  // ปรับปรุง confirmSellTicket เพื่อให้รีเฟรชข้อมูลหลังขายตั๋ว
  const handleConfirmSellTicket = async () => {
    try {
      await confirmSellTicket();
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      console.error('Error in ticket sale process:', error);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ຫນ້າການອອກປີ້</h1>
        
        <button
          onClick={() => fetchData()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          disabled={statsLoading}
        >
          {statsLoading ? 'ກຳລັງໂຫລດ...' : 'ອັບເດດຂໍ້ມູນ'}
        </button>
      </div>
      
      {/* Stats Cards */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Main Content - ปรับ Grid ให้สมดุล */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* ส่วนขายตั๋ว - ใช้ 2 columns */}
        <div className="xl:col-span-2">
          <NeoCard className="h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">ດຳເນີນການອອກປີ້</h2>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <TicketSalesForm
                ticketPrice={ticketPrice}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                onSellTicket={showConfirmation}
                loading={loading}
              />
            </div>
          </NeoCard>
        </div>

        {/* ส่วนแสดงตั๋วล่าสุด - ใช้ 3 columns */}
        <div className="xl:col-span-3">
          <NeoCard className="h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold text-gray-900">ປີ້ທີ່ອອກລ່າສຸດ</h2>
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {recentTickets.length} ລາຍການ
                  </span>
                </div>
                
                <button
                  onClick={() => fetchData()}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                  disabled={statsLoading}
                  title="ໂຫລດຂໍ້ມູນໃໝ່"
                >
                  {statsLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiRefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Container สำหรับ Recent Tickets ที่แสดงเต็ม 5 ใบ */}
              <div>
                <RecentTicketsList 
                  tickets={recentTickets} 
                  onViewAllClick={() => router.push('/dashboard/tickets/history')} 
                />
              </div>
            </div>
          </NeoCard>
        </div>
      </div>

      {/* Modal ยืนยันการขายตั๋ว */}
      <TicketConfirmationModal
        isOpen={showConfirmModal}
        ticketPrice={ticketPrice}
        paymentMethod={paymentMethod}
        quantity={quantity}
        onQuantityChange={updateQuantity}
        onConfirm={handleConfirmSellTicket}
        onCancel={cancelConfirmation}
        loading={loading}
      />

      {/* ส่วนซ่อนสำหรับการพิมพ์ตั๋ว */}
      <div ref={printRef} className="hidden">
        {createdTickets.length > 0 && createdTickets.map((ticket, index) => (
          <PrintableTicket
            key={index}
            ticketNumber={ticket.ticketNumber}
            price={ticket.price}
            soldAt={new Date(ticket.soldAt)}
            soldBy={ticket.soldBy}
            paymentMethod={ticket.paymentMethod}
          />
        ))}
      </div>
    </div>
  );
}