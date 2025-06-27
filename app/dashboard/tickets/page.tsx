// app/dashboard/tickets/page.tsx - Enhanced with Driver Selection
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import NeoCard from '@/components/ui/NotionCard';
import { StatsCards, TicketSalesForm, RecentTicketsList, PrintableTicket } from './components';
import TicketConfirmationModal from './components/TicketConfirmationModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import { FiRefreshCw, FiSettings } from 'react-icons/fi';

import useTicketSales from './hooks/useTicketSales';
import useTicketStats from './hooks/useTicketStats';

export default function TicketSalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // เพิ่ม state สำหรับ Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const { 
    ticketPrice, paymentMethod, setPaymentMethod, createdTickets,
    showConfirmation, cancelConfirmation, confirmSellTicket, showConfirmModal,
    quantity, updateQuantity, loading,
    
    // Group Ticket related
    ticketType, updateTicketType, refreshTicketPrice,
    
    // Destination related
    destination, updateDestination,
    
    // ✅ UPDATED: Car Selection related
    selectedCarRegistration, updateSelectedCar
  } = useTicketSales();
  
  const { 
    stats, 
    recentTickets, 
    loading: statsLoading, 
    error: statsError,
    fetchData,
    retryFetch,
    clearError
  } = useTicketStats();

  // ตรวจสอบสิทธิ์ Admin
  const isAdmin = session?.user?.role === 'admin';

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

  // ฟังก์ชันเปิด Settings Modal (เฉพาะ Admin)
  const handleOpenSettings = () => {
    if (isAdmin) {
      setShowSettingsModal(true);
    }
  };

  // ฟังก์ชันปิด Settings Modal
  const handleCloseSettings = () => {
    setShowSettingsModal(false);
  };

  // ✅ UPDATED: Get selected car info for display
  const [selectedCarInfo, setSelectedCarInfo] = useState<{registration: string, name: string, driverName: string, driverEmployeeId: string} | null>(null);
  
  useEffect(() => {
    if (selectedCarRegistration) {
      // Fetch car info for display
      fetch('/api/cars')
        .then(res => res.json())
        .then(cars => {
          const selectedCar = cars.find((car: any) => car.car_registration === selectedCarRegistration);
          if (selectedCar) {
            setSelectedCarInfo({
              registration: selectedCar.car_registration,
              name: selectedCar.car_name,
              driverName: selectedCar.user_id?.name || 'Unknown',
              driverEmployeeId: selectedCar.user_id?.employeeId || 'N/A'
            });
          }
        })
        .catch(err => console.warn('Failed to fetch car info:', err));
    } else {
      setSelectedCarInfo(null);
    }
  }, [selectedCarRegistration]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ຫນ້າການອອກປີ້</h1>
            <p className="text-gray-600">ລະບົບອອກປີ້ລົດໂດຍສານ ແລະ ຈັດການຂໍ້ມູນສະຖິຕິ</p>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {/* แสดงข้อมูลปลายทางปัจจุบัน */}
              {destination && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  <span className="mr-1">🎯</span>
                  <span>ປາຍທາງຕໍ່ໄປ: {destination}</span>
                </div>
              )}
              
              {/* ✅ UPDATED: แสดงข้อมูลรถที่เลือก */}
              {selectedCarInfo && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  <span className="mr-1">🚐</span>
                  <span>ລົດ: {selectedCarInfo.registration} - {selectedCarInfo.driverName} ({selectedCarInfo.driverEmployeeId})</span>
                </div>
              )}
            </div>
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

      {/* ✅ Error Display */}
      {statsError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <div>
                <h4 className="font-medium text-red-800">ເກີດຂໍ້ຜິດພາດໃນການໂຫລດຂໍ້ມູນ</h4>
                <p className="text-sm text-red-600 mt-1">{statsError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={retryFetch}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                disabled={statsLoading}
              >
                ລອງໃໝ່
              </button>
              <button
                onClick={clearError}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <NeoCard className="h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">ດຳເນີນການອອກປີ້</h2>
              
              <div className="flex items-center gap-2">
                {/* ไอคอน Settings - แสดงเฉพาะ Admin */}
                {isAdmin && (
                  <button
                    onClick={handleOpenSettings}
                    className="p-2 text-gray-400 hover:text-blue-600 transition rounded-lg hover:bg-blue-50 group"
                    title="ການຕັ້ງຄ່າລະບົບ (ເຉພາະແອດມິນ)"
                  >
                    <FiSettings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                )}
                
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
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

      {/* ✅ Enhanced Confirmation Modal with Driver Selection */}
      <TicketConfirmationModal
        isOpen={showConfirmModal}
        ticketPrice={ticketPrice}
        paymentMethod={paymentMethod}
        quantity={quantity}
        onQuantityChange={updateQuantity}
        onConfirm={handleConfirmSellTicket}
        onCancel={cancelConfirmation}
        loading={loading}
        
        // Group Ticket Props
        ticketType={ticketType}
        onTicketTypeChange={updateTicketType}
        
        // Destination Props
        destination={destination}
        onDestinationChange={updateDestination}
        
        // ✅ UPDATED: Car Selection Props
        selectedCarRegistration={selectedCarRegistration}
        onCarChange={updateSelectedCar}
      />

      {/* Admin Settings Modal */}
      {isAdmin && (
        <AdminSettingsModal
          isOpen={showSettingsModal}
          onClose={handleCloseSettings}
          onSettingsUpdate={() => {
            fetchData();
            refreshTicketPrice();
          }}
        />
      )}

      {/* Print Area - รองรับ Driver และ Destination */}
      <div className="hidden">
        {createdTickets.length > 0 && createdTickets.map((ticket, index) => (
          <PrintableTicket
            key={index}
            ticketNumber={ticket.ticketNumber}
            price={ticket.price}
            soldAt={new Date(ticket.soldAt)}
            soldBy={ticket.soldBy}
            paymentMethod={ticket.paymentMethod}
            
            // Group Ticket Props
            ticketType={ticket.ticketType}
            passengerCount={ticket.passengerCount}
            pricePerPerson={ticket.pricePerPerson}
            
            // Destination Props
            destination={ticket.destination}
          />
        ))}
      </div>
    </div>
  );
}