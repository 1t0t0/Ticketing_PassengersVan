// app/dashboard/tickets/page.tsx (Enhanced Version)
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// คอมโพเนนต์
import NeoCard from '@/components/ui/NotionCard';
import { StatsCards, TicketSalesForm, RecentTicketsList, PrintableTicket } from './components';
import TicketConfirmationModal from './components/TicketConfirmationModal';

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
  
  // Enhanced stats hook with real-time features
  const { 
    stats, 
    recentTickets, 
    loading: statsLoading, 
    fetchData,
    addNewTicketOptimistic,
    refreshData,
    getLastUpdateText,
    lastUpdate
  } = useTicketStats();

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

  // Enhanced ticket selling function with optimistic updates
  const handleSellTicketWithOptimisticUpdate = async () => {
    try {
      // แสดง confirmation modal
      showConfirmation();
    } catch (error) {
      console.error('Error in ticket selling process:', error);
    }
  };

  // Enhanced confirm sell function
  const handleConfirmSellTicket = async () => {
    try {
      // เรียกใช้ฟังก์ชันขายตั๋วเดิม
      const newTickets = await confirmSellTicket();
      
      // ถ้าขายสำเร็จ ให้อัพเดทแบบ optimistic สำหรับตั๋วทั้งหมดพร้อมกัน
      if (newTickets && newTickets.length > 0) {
        // แสดง notification เพียงครั้งเดียวสำหรับจำนวนรวม
        // (การแสดง notification จะถูกจัดการใน confirmSellTicket แล้ว)
        
        // อัพเดทตั๋วทีละใบเพื่อให้มี animation effect โดยไม่แสดง notification
        newTickets.forEach((ticket, index) => {
          setTimeout(() => {
            addNewTicketOptimistic(ticket, false); // ไม่แสดง notification
          }, index * 200); // แสดงทีละ 200ms เพื่อให้เห็น effect
        });
        
        // รีเฟรชข้อมูลจริงหลัง 2 วินาที
        setTimeout(() => {
          fetchData(undefined, undefined, true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error in enhanced ticket selling:', error);
      // ถ้าเกิดข้อผิดพลาด ให้รีเฟรชข้อมูลทันที
      refreshData();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ຫນ້າການອອກປີ້</h1>
        
        {/* Real-time status indicator */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>ອັບເດດສົດ</span>
          </div>
          {lastUpdate && (
            <span className="text-xs">
              ອັບເດດລ່າສຸດ: {lastUpdate.toLocaleTimeString('lo-LA')}
            </span>
          )}
        </div>
      </div>
      
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
            setPaymentMethod={setPaymentMethod}
            onSellTicket={handleSellTicketWithOptimisticUpdate}
            loading={loading}
          />
        </NeoCard>

        {/* ส่วนแสดงตั๋วล่าสุดพร้อม Real-time */}
        <NeoCard className="p-6">
          <h2 className="text-lg font-bold mb-4">ປີ້ທີ່ອອກລ່າສຸດ</h2>
          
          <RecentTicketsList 
            tickets={recentTickets} 
            onViewAllClick={() => router.push('/dashboard/tickets/history')}
            lastUpdate={lastUpdate}
            onRefresh={refreshData}
            loading={statsLoading}
            getLastUpdateText={getLastUpdateText}
          />
        </NeoCard>
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