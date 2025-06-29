// app/dashboard/tickets/page.tsx - FIXED Car Data Refresh Integration with Immediate Updates
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import NeoCard from '@/components/ui/NotionCard';
import { StatsCards, TicketSalesForm, RecentTicketsList, PrintableTicket } from './components';
import TicketConfirmationModal from './components/TicketConfirmationModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import { FiRefreshCw, FiSettings, FiTruck } from 'react-icons/fi';

import useTicketSales from './hooks/useTicketSales';
import useTicketStats from './hooks/useTicketStats';

// ✅ Interface for modal refresh
interface CarRefreshHandle {
  refreshCarData: () => void;
}

export default function TicketSalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // เพิ่ม state สำหรับ Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // ✅ Ref for TicketConfirmationModal to trigger car data refresh
  const ticketModalRef = useRef<CarRefreshHandle>(null);
  
  const { 
    ticketPrice, paymentMethod, setPaymentMethod, createdTickets,
    showConfirmation, cancelConfirmation, confirmSellTicket, showConfirmModal,
    quantity, updateQuantity, loading,
    
    // Group Ticket related
    ticketType, updateTicketType, refreshTicketPrice,
    
    // Destination related
    destination, updateDestination,
    
    // Car Selection related
    selectedCarRegistration, updateSelectedCar,
    
    // ✅ Car refresh callback registration
    registerCarRefreshCallback
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

  // ✅ CRITICAL FIX: Enhanced car refresh callback registration
  useEffect(() => {
    if (ticketModalRef.current) {
      console.log('🔄 Registering car refresh callback...');
      registerCarRefreshCallback(() => {
        if (ticketModalRef.current) {
          console.log('🔄 Executing registered car refresh callback...');
          ticketModalRef.current.refreshCarData();
        }
      });
    }
  }, [registerCarRefreshCallback, showConfirmModal]);

  // ✅ CRITICAL FIX: Enhanced ticket creation effect with immediate refresh
  useEffect(() => {
    if (createdTickets && Array.isArray(createdTickets) && createdTickets.length > 0) {
      console.log('🎉 Tickets created, initiating comprehensive refresh...', {
        ticketCount: createdTickets.length,
        assignedCar: selectedCarRegistration
      });
      
      const timer = setTimeout(() => {
        console.log('🔄 Refreshing dashboard data after ticket creation...');
        fetchData();
        
        // ✅ CRITICAL: Multiple immediate refresh strategies
        if (ticketModalRef.current) {
          console.log('🔄 Strategy A: Immediate modal refresh...');
          ticketModalRef.current.refreshCarData();
          
          // Strategy B: Quick follow-up refresh
          setTimeout(() => {
            if (ticketModalRef.current) {
              console.log('🔄 Strategy B: Quick follow-up refresh (500ms)...');
              ticketModalRef.current.refreshCarData();
            }
          }, 500);
          
          // Strategy C: Medium delay refresh  
          setTimeout(() => {
            if (ticketModalRef.current) {
              console.log('🔄 Strategy C: Medium delay refresh (1200ms)...');
              ticketModalRef.current.refreshCarData();
            }
          }, 1200);
        }
      }, 200); // Reduced from 1000ms to 200ms for faster response
      
      return () => clearTimeout(timer);
    }
  }, [createdTickets, fetchData, selectedCarRegistration]);

  // ✅ Enhanced confirm function with immediate car data refresh
  const handleConfirmSellTicket = async () => {
    try {
      console.log('🎯 Starting ticket creation process...');
      
      // Create tickets with car assignment
      await confirmSellTicket();
      
      console.log('✅ Ticket creation completed, initiating immediate refresh...');
      
      // ✅ CRITICAL: Immediate refresh sequence
      
      // Step 1: Immediate modal refresh
      if (ticketModalRef.current) {
        console.log('🔄 Step 1: Immediate modal refresh...');
        ticketModalRef.current.refreshCarData();
      }
      
      // Step 2: Quick dashboard refresh 
      setTimeout(() => {
        console.log('🔄 Step 2: Quick dashboard refresh (300ms)...');
        fetchData();
      }, 300);
      
      // Step 3: Follow-up modal refresh
      setTimeout(() => {
        if (ticketModalRef.current) {
          console.log('🔄 Step 3: Follow-up modal refresh (800ms)...');
          ticketModalRef.current.refreshCarData();
        }
      }, 800);
      
      // Step 4: Final confirmation refresh
      setTimeout(() => {
        if (ticketModalRef.current) {
          console.log('🔄 Step 4: Final confirmation refresh (2000ms)...');
          ticketModalRef.current.refreshCarData();
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error in ticket sale process:', error);
    }
  };

  // ✅ Enhanced refresh function that also refreshes modal data immediately
  const handleRefreshData = async () => {
    console.log('🔄 Manual refresh triggered...');
    
    await fetchData();
    
    // Also refresh car data in modal immediately if it's open
    if (showConfirmModal && ticketModalRef.current) {
      console.log('🔄 Refreshing car data in modal via manual refresh...');
      setTimeout(() => {
        if (ticketModalRef.current) {
          ticketModalRef.current.refreshCarData();
        }
      }, 100);
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

  // ✅ Get selected car info for display with safe checking
  const [selectedCarInfo, setSelectedCarInfo] = useState<{
    registration: string, 
    name: string, 
    driverName: string, 
    driverEmployeeId: string,
    capacity: number
  } | null>(null);
  
  // ✅ Enhanced car info fetching with cache busting
  useEffect(() => {
    if (selectedCarRegistration) {
      const fetchCarInfo = async () => {
        try {
          // ✅ Add cache busting for real-time data
          const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const response = await fetch(`/api/cars?_t=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const cars = await response.json();
          
          if (Array.isArray(cars) && cars.length > 0) {
            const selectedCar = cars.find((car: any) => car.car_registration === selectedCarRegistration);
            if (selectedCar) {
              setSelectedCarInfo({
                registration: selectedCar.car_registration || '',
                name: selectedCar.car_name || '',
                driverName: selectedCar.user_id?.name || 'Unknown',
                driverEmployeeId: selectedCar.user_id?.employeeId || 'N/A',
                capacity: selectedCar.car_capacity || 0
              });
              console.log('✅ Selected car info updated:', {
                registration: selectedCar.car_registration,
                driver: selectedCar.user_id?.name,
                capacity: selectedCar.car_capacity
              });
            }
          } else {
            console.warn('No cars data received or invalid format');
            setSelectedCarInfo(null);
          }
        } catch (err) {
          console.warn('Failed to fetch car info:', err);
          setSelectedCarInfo(null);
        }
      };

      fetchCarInfo();
    } else {
      setSelectedCarInfo(null);
    }
  }, [selectedCarRegistration]);

  // ✅ CRITICAL: Listen for external car usage updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'car-usage-updated') {
        console.log('🔄 Detected car usage update from storage, refreshing modal...');
        if (ticketModalRef.current) {
          setTimeout(() => {
            ticketModalRef.current?.refreshCarData();
          }, 300);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail?.action === 'ticket_created') {
        console.log('🔄 Detected ticket creation event, refreshing modal...', e.detail);
        if (ticketModalRef.current) {
          setTimeout(() => {
            ticketModalRef.current?.refreshCarData();
          }, 200);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('carUsageUpdated', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('carUsageUpdated', handleCustomEvent as EventListener);
    };
  }, []);

  // ✅ FIXED: Safe checking for recentTickets
  const safeRecentTickets = Array.isArray(recentTickets) ? recentTickets : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ຫນ້າການອອກປີ້</h1>
            <p className="text-gray-600">ລະບົບ POS ສຳລັບອອກປີ້ລົດໂດຍສານ ແລະ ກຳໜົດລົດໃຫ້ລູກຄ້າ</p>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {/* แสดงข้อมูลปลายทางปัจจุบัน */}
              {destination && destination.trim() && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  <span className="mr-1">🎯</span>
                  <span>ປາຍທາງຕໍ່ໄປ: {destination}</span>
                </div>
              )}
              
              {/* แสดงข้อมูลรถที่เลือก */}
              {selectedCarInfo && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  <span className="mr-1">🚐</span>
                  <span>ລົດທີ່ແນະນຳ: {selectedCarInfo.registration} - {selectedCarInfo.driverName} ({selectedCarInfo.driverEmployeeId})</span>
                </div>
              )}
              
              {/* ✅ แสดงสถานะการซิงค์ข้อมูล */}
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                <span className="mr-1">🔄</span>
                <span>Real-time sync: {new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
              disabled={statsLoading}
            >
              {statsLoading ? 'ກຳລັງໂຫລດ...' : 'ອັບເດດຂໍ້ມູນ'}
            </button>
          </div>
        </div>
      </div>
      
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Error Display */}
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
                    title="ການຕັ້ງຄ່າລະບົບ (ເຊພາະແອດມິນ)"
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
                  {safeRecentTickets.length} ລາຍການ
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshData}
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
              tickets={safeRecentTickets} 
              onViewAllClick={() => router.push('/dashboard/tickets/history')} 
            />
          </NeoCard>
        </div>
      </div>

      {/* ✅ FIXED: Confirmation Modal with enhanced ref for car data refresh */}
      <TicketConfirmationModal
        ref={ticketModalRef}
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
        
        // Car Selection Props
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

      {/* Print Area - รองรับ Car Assignment และ Destination */}
      <div className="hidden">
        {createdTickets && Array.isArray(createdTickets) && createdTickets.length > 0 && 
          createdTickets.map((ticket, index) => (
            <PrintableTicket
              key={`${ticket.ticketNumber}-${index}`}
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
          ))
        }
      </div>
    </div>
  );
}