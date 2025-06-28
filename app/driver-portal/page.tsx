// app/driver-portal/page.tsx - ลบ Booking System ออกแล้ว
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  FiPlay, 
  FiUsers, 
  FiCheckCircle, 
  FiRefreshCw,
  FiCamera,
  FiClock,
  FiTruck,
  FiSquare,
  FiAlertTriangle,
  FiX
} from 'react-icons/fi';
import notificationService from '@/lib/notificationService';
import { Scan } from 'lucide-react';

// ✅ เหลือแค่ AssignedTicketsPanel เท่านั้น
import AssignedTicketsPanel from './components/AssignedTicketsPanel';

// Dynamic import สำหรับ QR Scanner
const QRCodeScanner = dynamic(() => import('@/components/QRCodeScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

interface TripStatus {
  has_active_trip: boolean;
  active_trip?: {
    trip_id: string;
    trip_number: number;
    current_passengers: number;
    required_passengers: number;
    car_capacity: number;
    started_at: string;
    passengers: Array<{
      order: number;
      ticket_number: string;
      scanned_at: string;
    }>;
  };
  completed_trips_today: number;
  qualifies_for_revenue: boolean;
  revenue_status: string;
}

export default function DriverPortalMainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [ticketInput, setTicketInput] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showAllPassengers, setShowAllPassengers] = useState(false);
  
  // ✅ เหลือแค่ assigned tickets refresh trigger
  const [assignedTicketsRefreshTrigger, setAssignedTicketsRefreshTrigger] = useState(0);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // ดึงข้อมูลสถานะรอบ
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const tripResponse = await fetch('/api/driver/trip');
      const tripData = await tripResponse.json();
      
      if (tripData.success) {
        setTripStatus(tripData.data);
      }
      
      setLastRefresh(new Date());
      
      // ✅ Trigger refresh assigned tickets เท่านั้น
      setAssignedTicketsRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການໂຫລດຂໍ້ມູນ');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // เริ่มรอบใหม่
  const startNewTrip = async () => {
    try {
      setStartingTrip(true);
      
      const response = await fetch('/api/driver/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        notificationService.success('ເລີ່ມການເດີນທາງໃໝ່ສຳເລັດ!');
        await fetchData(false);
      } else {
        notificationService.error(result.error);
      }
      
    } catch (error) {
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການເລີ່ມຮອບໃໝ່');
    } finally {
      setStartingTrip(false);
    }
  };

  // ฟังก์ชันเปิด modal
  const handleCompleteTrip = () => {
    if (!tripStatus?.active_trip) return;
    setShowCompleteModal(true);
  };

  // ฟังก์ชันปิดรอบจริง (จาก modal)
  const confirmCompleteTrip = async () => {
    setShowCompleteModal(false);
    
    try {
      setCompletingTrip(true);
      
      const response = await fetch('/api/driver/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        notificationService.success(result.message);
        
        setTimeout(() => {
          notificationService.info(result.qualification_status);
        }, 1500);
        
        await fetchData(false);
      } else {
        notificationService.error(result.error);
      }
      
    } catch (error) {
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການປິດຮອບ');
    } finally {
      setCompletingTrip(false);
    }
  };

  // สแกน QR Code หรือ Manual Input
  const processTicketScan = async (ticketData: string) => {
    if (!ticketData.trim()) {
      setScanResult('❌ ກະລຸນາໃສ່ເລກທີ່ຂອງປີ້');
      notificationService.error('ກະລຸນາໃສ່ເລກທີ່ຂອງປີ້');
      return;
    }

    try {
      setScanning(true);
      
      let ticketId = ticketData.trim();
      let qrData = undefined;
      
      try {
        const parsed = JSON.parse(ticketData);
        if (parsed.ticketNumber) {
          ticketId = parsed.ticketNumber;
          qrData = ticketData;
          console.log('🎫 Group Ticket detected:', parsed);
        }
      } catch {
        console.log('📝 Individual Ticket detected:', ticketData);
      }
      
      const requestBody: any = { ticketId };
      if (qrData) {
        requestBody.qrData = qrData;
      }
      
      const response = await fetch('/api/driver/trip/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.group_ticket_info?.is_group_ticket) {
          notificationService.success(
            `✅ ສະແກນປີ້ກະລຸ່ມສຳເລັດ! ເພີ່ມ ${result.ticket_info.passenger_count} ຄົນ`
          );
        } else {
          notificationService.success(result.message);
        }
        
        if (result.status_message) {
          setTimeout(() => {
            notificationService.info(result.status_message);
          }, 1000);
        }
        
        setTicketInput('');
        await fetchData(false);
      } else {
        const isDuplicateTicket = result.error && result.error.includes('ຖືກສະແກນໄປແລ້ວ');
        
        if (isDuplicateTicket) {
          notificationService.warning(result.error);
        } else {
          notificationService.error(result.error);
        }
      }
      
    } catch (error) {
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການສະແກນ');
    } finally {
      setScanning(false);
    }
  };

  const handleQRScanResult = (ticketNumber: string) => {
    setShowQRScanner(false);
    setTicketInput(ticketNumber);
    processTicketScan(ticketNumber);
  };

  const handleQRScanError = (error: string) => {
    notificationService.error(error);
  };

  const handleManualScan = () => {
    processTicketScan(ticketInput);
  };

  const toggleShowAllPassengers = () => {
    setShowAllPassengers(!showAllPassengers);
  };

  useEffect(() => {
    if (session?.user?.role === 'driver') {
      fetchData();
      
      const interval = setInterval(() => {
        fetchData(false);
      }, 120000);
      
      return () => clearInterval(interval);
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'driver') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫລດຂໍ້ມູນ...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = tripStatus?.active_trip 
    ? Math.min(
        (tripStatus.active_trip.current_passengers / tripStatus.active_trip.required_passengers) * 100, 
        100
      )
    : 0;

  const occupancyPercentage = tripStatus?.active_trip 
    ? (tripStatus.active_trip.current_passengers / tripStatus.active_trip.car_capacity) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Scan className="mr-3 text-blue-600" />
                ສະແກນປີ້ ແລະ ຈັດການການເດີນທາງ
              </h1>
              <p className="text-gray-600 mt-1">ສະບາຍດີ, {session?.user?.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                ອັບເດດລ່າສຸດ: {lastRefresh.toLocaleTimeString('lo-LA')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                ອັບເດດ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* สถิติด่วน */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FiCheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ຮອບທີ່ສຳເລັດ</p>
                <p className="text-2xl font-bold text-gray-900">{tripStatus?.completed_trips_today || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FiUsers className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ຜູ້ໂດຍສານປັດຈຸບັນ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tripStatus?.active_trip?.current_passengers || 0}/{tripStatus?.active_trip?.car_capacity || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Layout ใหม่: 2 คอลัมน์ (Assigned Tickets + QR Scanner) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* ✅ Assigned Tickets Panel - ครึ่งแรก */}
          <div className="xl:col-span-1">
            <AssignedTicketsPanel 
              driverId={session?.user?.id || ''} 
              refreshTrigger={assignedTicketsRefreshTrigger}
            />
          </div>

          {/* ✅ QR Scanner Section - ครึ่งหลัง */}
          <div className="xl:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Scan className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">ສະແກນ QR Code</h2>
                  <p className="text-gray-600 text-sm mb-1">ສະແກນ QR Code ຈາກປີ້ ຫຼື ໃສ່ເລກທີ່ປີ້ດ້ວຍມື</p>
                  {tripStatus?.active_trip && (
                    <p className="text-sm text-blue-600 font-medium">
                      ເປົ້າໝາຍ: {tripStatus.active_trip?.current_passengers}/{tripStatus.active_trip?.required_passengers} ຄົນ 
                      (ທັງໝົດ: {tripStatus.active_trip?.car_capacity})
                    </p>
                  )}
                </div>

                {tripStatus?.has_active_trip ? (
                  <>
                    {/* Camera Scan Button */}
                    <div className="mb-4">
                      <button
                        onClick={() => setShowQRScanner(true)}
                        disabled={tripStatus.active_trip?.current_passengers >= tripStatus.active_trip?.car_capacity}
                        className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-bold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <FiCamera className="mr-3 h-6 w-6" />
                        {tripStatus.active_trip?.current_passengers >= tripStatus.active_trip?.car_capacity 
                          ? 'ລົດເຕັມແລ້ວ' 
                          : 'ເປີດກ້ອງສະແກນ'
                        }
                      </button>
                    </div>

                    {/* หรือ Divider */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="px-3 text-gray-500 bg-transparent text-sm">ຫຼື</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* Manual Input */}
                    <div className="bg-white rounded-xl p-4 shadow-inner">
                      <label className="block text-md font-semibold text-gray-800 mb-2">
                        ໃສ່ເລກທີ່ປີ້ດ້ວຍມື
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={ticketInput}
                          onChange={(e) => setTicketInput(e.target.value)}
                          placeholder="ໃສ່ເລກທີ່ປີ້ ເຊັ່ນ: T00001"
                          className="flex-1 px-3 py-3 text-md border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                          disabled={tripStatus.active_trip?.current_passengers >= tripStatus.active_trip?.car_capacity}
                        />
                        <button
                          onClick={handleManualScan}
                          disabled={scanning || !ticketInput.trim() || (tripStatus.active_trip?.current_passengers >= tripStatus.active_trip?.car_capacity)}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-md rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          {scanning ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              ສະແກນ...
                            </div>
                          ) : (
                            'ສະແກນ'
                          )}
                        </button>
                      </div>
                    </div>

                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Scan className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">ເລີ່ມການເດີນທາງເພື່ອສະແກນ QR Code</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* สถานะการเดินทาง Section - ขยายให้เต็มความกว้าง */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <FiTruck className="mr-3 text-blue-600" />
              ສະຖານະການເດີນທາງ
            </h2>
            
            {tripStatus?.has_active_trip ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-blue-900">
                      ຮອບທີ {tripStatus.active_trip?.trip_number} - ກຳລັງດຳເນີນການ
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full font-medium">
                        ໃນຂະບວນການ
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-blue-700 mb-2">
                      <span>ເປົ້າໝາຍ: {progressPercentage.toFixed(0)}%</span>
                      <span>ຄວາມຈຸ: {occupancyPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {tripStatus.active_trip?.current_passengers}
                      </p>
                      <p className="text-sm text-gray-600">ຜູ້ໂດຍສານປັດຈຸບັນ</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {tripStatus.active_trip?.required_passengers}
                      </p>
                      <p className="text-sm text-gray-600">ເປົ້າໝາຍ (80%)</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-2xl font-bold text-gray-600">
                        {tripStatus.active_trip?.car_capacity}
                      </p>
                      <p className="text-sm text-gray-600">ຄວາມຈຸລົດ</p>
                    </div>
                  </div>

                  {/* ปุ่มปิดรอบ */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleCompleteTrip}
                      disabled={completingTrip || tripStatus.active_trip?.current_passengers === 0}
                      className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        (tripStatus.active_trip?.current_passengers >= tripStatus.active_trip?.required_passengers)
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                      }`}
                    >
                      {completingTrip ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          ກຳລັງປິດຮອບ...
                        </>
                      ) : (
                        <>
                          <FiSquare className="mr-2" />
                          ປິດຮອບ
                          {(tripStatus.active_trip?.current_passengers < tripStatus.active_trip?.required_passengers) && (
                            <FiAlertTriangle className="ml-2 h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                  </div>

                  {/* แสดงคำเตือนถ้ายังไม่ถึง 80% */}
                  {(tripStatus.active_trip?.current_passengers < tripStatus.active_trip?.required_passengers) && (
                    <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                      <p className="text-sm text-orange-800 text-center">
                        ⚠️ ຍັງບໍ່ຄົບເປົ້າໝາຍ - ຮອບນີ້ຈະບໍ່ນັບເຂົ້າເງື່ອນໄຂລາຍຮັບ
                      </p>
                    </div>
                  )}
                </div>
                
                {/* แสดงรายชื่อผู้โดยสาร */}
                {tripStatus.active_trip?.passengers && tripStatus.active_trip.passengers.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-4 flex items-center">
                      <FiUsers className="mr-2 text-gray-600" />
                      ຜູ້ໂດຍສານທີ່ສະແກນແລ້ວ ({tripStatus.active_trip.passengers.length} ຄົນ):
                    </h4>
                    <div className="space-y-3">
                      <div className={`space-y-3 overflow-y-auto transition-all duration-300 ${
                        showAllPassengers ? 'max-h-96' : 'max-h-32'
                      }`}>
                        {tripStatus.active_trip.passengers
                          .slice()
                          .reverse()
                          .slice(0, showAllPassengers ? undefined : 2)
                          .map((passenger, index) => {
                            let displayTicketId = passenger.ticket_number;
                            
                            if (displayTicketId && displayTicketId.length === 24 && /^[0-9a-fA-F]{24}$/.test(displayTicketId)) {
                              displayTicketId = `T${passenger.order.toString().padStart(5, '0')}`;
                            }
                            
                            return (
                              <div key={`${passenger.ticket_number}-${index}`} className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm">
                                <div className="flex items-center">
                                  <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                                    #{passenger.order}
                                  </span>
                                  <span className="ml-3 text-gray-900 font-medium">{displayTicketId}</span>
                                </div>
                                <span className="text-sm text-gray-500 flex items-center">
                                  <FiClock className="mr-1" />
                                  {new Date(passenger.scanned_at).toLocaleTimeString('lo-LA', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                      
                      {tripStatus.active_trip.passengers.length > 2 && (
                        <div className="pt-2 border-t border-gray-200">
                          <button 
                            onClick={toggleShowAllPassengers}
                            className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 hover:bg-blue-50 rounded transition-colors"
                          >
                            {showAllPassengers 
                              ? 'ປິດລາຍການ' 
                              : `ເບິ່ງທັງໝົດ ${tripStatus.active_trip.passengers.length} ຄົນ`
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiPlay className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ບໍ່ມີການເດີນທາງທີ່ດຳເນີນການຢູ່</h3>
                <p className="text-gray-500 mb-6">ກົດປຸ່ມເພື່ອເລີ່ມການເດີນທາງໃໝ່</p>
                <button
                  onClick={startNewTrip}
                  disabled={startingTrip}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 shadow-lg"
                >
                  <FiPlay className="mr-3" />
                  {startingTrip ? 'ກຳລັງເລີ່ມ...' : 'ເລີ່ມການເດີນທາງໃໝ່'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Trip Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                    <FiSquare className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4 w-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ຢືນຢັນການປິດຮອບ
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    ທ່ານຕ້ອງການປິດຮອບທີ {tripStatus?.active_trip?.trip_number} ແມ່ນບໍ?
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>ຜູ້ໂດຍສານປັດຈຸບັນ:</span>
                        <span className="font-medium">{tripStatus?.active_trip?.current_passengers} ຄົນ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ເປົ້າໝາຍ (80%):</span>
                        <span className="font-medium">{tripStatus?.active_trip?.required_passengers} ຄົນ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ຄວາມຈຸລົດ:</span>
                        <span className="font-medium">{tripStatus?.active_trip?.car_capacity} ຄົນ</span>
                      </div>
                    </div>
                  </div>

                  {tripStatus?.active_trip?.current_passengers >= tripStatus?.active_trip?.required_passengers ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <FiCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800 font-medium">
                          ✅ ຄົບເປົ້າໝາຍແລ້ວ - ຮອບນີ້ຈະນັບເຂົ້າເງື່ອນໄຂລາຍຮັບ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <FiAlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                        <span className="text-sm text-orange-800 font-medium">
                          ⚠️ ຍັງບໍ່ຄົບເປົ້າໝາຍ - ຮອບນີ້ບໍ່ນັບເຂົ້າເງື່ອນໄຂລາຍຮັບ
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowCompleteModal(false)}
                disabled={completingTrip}
              >
                <FiX className="inline mr-2 h-4 w-4" />
                ຍົກເລີກ
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                onClick={confirmCompleteTrip}
                disabled={completingTrip}
              >
                {completingTrip ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                    ກຳລັງປິດຮອບ...
                  </>
                ) : (
                  'ຢືນຢັນປິດຮອບ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScanResult}
          onError={handleQRScanError}
        />
      )}
    </div>
  );
}