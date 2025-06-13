// app/dashboard/tickets/page.tsx - Enhanced with Group Ticket Support
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import NeoCard from '@/components/ui/NotionCard';
import { StatsCards, TicketSalesForm, RecentTicketsList, PrintableTicket } from './components';
import TicketConfirmationModal from './components/TicketConfirmationModal';
import { FiRefreshCw } from 'react-icons/fi';

import useTicketSales from './hooks/useTicketSales';
import useTicketStats from './hooks/useTicketStats';

export default function TicketSalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { 
    ticketPrice, paymentMethod, setPaymentMethod, createdTickets,
    showConfirmation, cancelConfirmation, confirmSellTicket, showConfirmModal,
    quantity, updateQuantity, loading,
    
    // ✅ Group Ticket related
    ticketType, updateTicketType
  } = useTicketSales();
  
  const { stats, recentTickets, loading: statsLoading, fetchData } = useTicketStats();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status, fetchData]);

  useEffect(() => {
    if (createdTickets.length > 0) {
      const timer = setTimeout(() => fetchData(), 1000);
      return () => clearTimeout(timer);
    }
  }, [createdTickets, fetchData]);

  const handleConfirmSellTicket = async () => {
    try {
      await confirmSellTicket();
      setTimeout(() => fetchData(), 500);
    } catch (error) {
      console.error('Error in ticket sale process:', error);
    }
  };


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🎫 ຫນ້າການອອກປີ້</h1>
            <p className="text-gray-600">ລະບົບອອກປີ້ລົດໂດຍສານ ແລະ ຈັດການຂໍ້ມູນສະຖິຕິ</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
              disabled={statsLoading}
            >
              {statsLoading ? 'ກຳລັງໂຫລດ...' : 'ອັບເດດຂໍ້ມູນ'}
            </button>
          </div>
        </div>
      </div>
      
      <StatsCards stats={stats} loading={statsLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <NeoCard className="h-full p-6">
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
          </NeoCard>
        </div>

        <div className="xl:col-span-3">
          <NeoCard className="h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-900">ປີ້ທີ່ອອກລ່າສຸດ</h2>
                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {recentTickets.length} ລາຍການ
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchData()}
                  className="p-2 text-gray-400 hover:text-blue-600 transition rounded-lg hover:bg-blue-50"
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
            </div>
            
            <RecentTicketsList 
              tickets={recentTickets} 
              onViewAllClick={() => router.push('/dashboard/tickets/history')} 
            />
          </NeoCard>
        </div>
      </div>

      {/* ✅ Enhanced Confirmation Modal with Group Ticket Support */}
      <TicketConfirmationModal
        isOpen={showConfirmModal}
        ticketPrice={ticketPrice}
        paymentMethod={paymentMethod}
        quantity={quantity}
        onQuantityChange={updateQuantity}
        onConfirm={handleConfirmSellTicket}
        onCancel={cancelConfirmation}
        loading={loading}
        
        // ✅ Group Ticket Props
        ticketType={ticketType}
        onTicketTypeChange={updateTicketType}
      />

      {/* ✅ Print Area - รองรับ Group Ticket */}
      <div className="hidden">
        {createdTickets.length > 0 && createdTickets.map((ticket, index) => (
          <PrintableTicket
            key={index}
            ticketNumber={ticket.ticketNumber}
            price={ticket.price}
            soldAt={new Date(ticket.soldAt)}
            soldBy={ticket.soldBy}
            paymentMethod={ticket.paymentMethod}
            
            // ✅ เพิ่ม Props สำหรับ Group Ticket
            ticketType={ticket.ticketType}
            passengerCount={ticket.passengerCount}
            pricePerPerson={ticket.pricePerPerson}
          />
        ))}
      </div>
    </div>
  );
}