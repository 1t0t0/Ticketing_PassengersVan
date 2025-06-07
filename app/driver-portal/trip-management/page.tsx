// app/driver-portal/trip-management/page.tsx - หน้าจัดการรอบการเดินทางใหม่
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FiPlay, 
  FiUsers, 
  FiCheckCircle, 
  FiAlertCircle,
  FiDollarSign,
  FiRefreshCw,
  FiCamera,
  FiClock,
  FiTruck,
  FiMapPin,
  FiTarget
} from 'react-icons/fi';
import notificationService from '@/lib/notificationService';

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

interface RevenueData {
  total_revenue: number;
  driver_share_total: number;
  qualified_drivers: number;
  my_qualification: {
    completed_trips: number;
    qualifies: boolean;
    revenue_share: number;
    status_message: string;
  };
}

export default function DriverTripManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);
  const [ticketInput, setTicketInput] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // ดึงข้อมูลสถานะรอบและรายได้
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ดึงสถานะรอบ
      const tripResponse = await fetch('/api/driver/trip');
      const tripData = await tripResponse.json();
      
      // ดึงข้อมูลรายได้
      const revenueResponse = await fetch('/api/driver/revenue');
      const revenueInfo = await revenueResponse.json();
      
      if (tripData.success) {
        setTripStatus(tripData.data);
      }
      
      if (revenueInfo.success) {
        setRevenueData(revenueInfo.revenue_data);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການໂຫລດຂໍ້ມູນ');
    } finally {
      setLoading(false);
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
        setScanResult(`✅ ${result.message}`);
        notificationService.success('ເລີ່ມການເດີນທາງໃໝ່ສຳເລັດ!');
        await fetchData();
      } else {
        setScanResult(`❌ ${result.error}`);
        notificationService.error(result.error);
      }
      
    } catch (error) {
      setScanResult('❌ ເກີດຂໍ້ຜິດພາດໃນການເລີ່ມຮອບໃໝ່');
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການເລີ່ມຮອບໃໝ່');
    } finally {
      setStartingTrip(false);
    }
  };

  // สแกน QR Code
  const scanTicket = async () => {
    if (!ticketInput.trim()) {
      setScanResult('❌ ກະລຸນາໃສ່ເລກທີ່ຕັ້ວ');
      notificationService.error('ກະລຸນາໃສ່ເລກທີ່ຕັ້ວ');
      return;
    }

    try {
      setScanning(true);
      
      const response = await fetch('/api/driver/trip/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticketInput.trim() })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setScanResult(`✅ ${result.message}`);
        notificationService.success(result.message);
        setTicketInput('');
        
        // ถ้าครบรอบให้แสดงข้อความพิเศษ
        if (result.trip_completed) {
          setTimeout(() => {
            notificationService.success(`🎉 ສຳເລັດຮອບທີ ${result.trip_number}! ສາມາດເລີ່ມຮອບໃໝ່ໄດ້`);
          }, 1000);
        }
        
        await fetchData();
      } else {
        setScanResult(`❌ ${result.error}`);
        notificationService.error(result.error);
      }
      
    } catch (error) {
      setScanResult('❌ ເກີດຂໍ້ຜິດພາດໃນການສະແກນ');
      notificationService.error('ເກີດຂໍ້ຜິດພາດໃນການສະແກນ');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'driver') {
      fetchData();
      // Auto refresh ทุก 30 วินาที
      const interval = setInterval(fetchData, 30000);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const progressPercentage = tripStatus?.active_trip 
    ? Math.min(
        (tripStatus.active_trip.current_passengers / tripStatus.active_trip.required_passengers) * 100, 
        100
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FiTruck className="mr-3 text-blue-600" />
                ຈັດການການເດີນທາງ
              </h1>
              <p className="text-gray-600 mt-1">ສະບາຍດີ, {session?.user?.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* สถิติด่วน */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <FiTarget className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ເປົ້າໝາຍ</p>
                <p className="text-2xl font-bold text-gray-900">2 ຮອບ</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                tripStatus?.qualifies_for_revenue ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <FiDollarSign className={`h-6 w-6 ${
                  tripStatus?.qualifies_for_revenue ? 'text-green-600' : 'text-orange-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ສິດລາຍຮັບ</p>
                <p className={`text-lg font-bold ${
                  tripStatus?.qualifies_for_revenue ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {tripStatus?.qualifies_for_revenue ? 'ມີສິດ' : 'ຍັງບໍ່ມີ'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <FiMapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ເສັ້ນທາງ</p>
                <p className="text-sm font-bold text-gray-900">ສະຖານີ→ເມືອງ</p>
              </div>
            </div>
          </div>
        </div>

        {/* สถานะรอบปัจจุบัน */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <FiUsers className="mr-3 text-blue-600" />
              ສະຖານະການເດີນທາງ
            </h2>
            
            {tripStatus?.has_active_trip ? (
              <div className="space-y-6">
                {/* Header ของรอบ */}
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
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-blue-700 mb-2">
                      <span>ຄວາມຄືບໜ້າ: {progressPercentage.toFixed(0)}%</span>
                      <span>
                        {tripStatus.active_trip?.current_passengers}/{tripStatus.active_trip?.required_passengers} ຄົນ
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* สถิติ */}
                  <div className="grid grid-cols-3 gap-4 text-center">
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
                </div>
                
                {/* รายการผู้โดยสาร */}
                {tripStatus.active_trip?.passengers && tripStatus.active_trip.passengers.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-4 flex items-center">
                      <FiUsers className="mr-2 text-gray-600" />
                      ຜູ້ໂດຍສານທີ່ສະແກນແລ້ວ ({tripStatus.active_trip.passengers.length} ຄົນ):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {tripStatus.active_trip.passengers.map((passenger, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                          <div>
                            <span className="font-medium text-blue-600">#{passenger.order}</span>
                            <span className="ml-2 text-gray-700">{passenger.ticket_number}</span>
                          </div>
                          <span className="text-sm text-gray-500 flex items-center">
                            <FiClock className="mr-1" />
                            {new Date(passenger.scanned_at).toLocaleTimeString('lo-LA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
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

        {/* สแกน QR Code */}
        {tripStatus?.has_active_trip && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FiCamera className="mr-3 text-purple-600" />
                ສະແກນ QR Code
              </h2>
              
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-700 mb-2">
                    <strong>ວິທີໃຊ້:</strong> ໃສ່ເລກທີ່ຕັ້ວ ຫຼື ສະແກນ QR Code ຈາກຕັ້ວ
                  </p>
                  <p className="text-xs text-purple-600">
                    ແຕ່ລະ QR Code = 1 ຜູ້ໂດຍສານ | ເປົ້າໝາຍ: {tripStatus.active_trip?.required_passengers} ຄົນ (80% ຂອງຄວາມຈຸລົດ)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ເລກທີ່ຕັ້ວ ຫຼື QR Code
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value)}
                      placeholder="ໃສ່ເລກທີ່ຕັ້ວ ເຊັ່ນ: T1234567890..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && scanTicket()}
                    />
                    <button
                      onClick={scanTicket}
                      disabled={scanning || !ticketInput.trim()}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {scanning ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          ກຳລັງສະແກນ...
                        </div>
                      ) : (
                        'ສະແກນ'
                      )}
                    </button>
                  </div>
                </div>
                
                {scanResult && (
                  <div className={`p-4 rounded-lg border ${
                    scanResult.startsWith('✅') 
                      ? 'bg-green-50 text-green-800 border-green-200' 
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    <p className="font-medium">{scanResult}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* สถานะรายได้ */}
        {revenueData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FiDollarSign className="mr-3 text-green-600" />
                ສະຖານະລາຍຮັບ
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-lg border-2 ${
                  revenueData.my_qualification.qualifies 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      revenueData.my_qualification.qualifies ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      ₭{revenueData.my_qualification.revenue_share.toLocaleString()}
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-4">ສ່ວນແບ່ງລາຍຮັບຂອງທ່ານ</p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      revenueData.my_qualification.qualifies 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {revenueData.my_qualification.qualifies ? '✅ ມີສິດຮັບ' : '⏳ ຍັງບໍ່ມີສິດ'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">ລາຍຮັບລວມວັນນີ້:</span>
                    <span className="font-bold text-gray-900">₭{revenueData.total_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">ສ່ວນແບ່ງຄົນຂັບ (85%):</span>
                    <span className="font-bold text-blue-600">₭{revenueData.driver_share_total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">ຄົນຂັບທີ່ມີສິດ:</span>
                    <span className="font-bold text-green-600">{revenueData.qualified_drivers} ຄົນ</span>
                  </div>
                </div>
              </div>
              
              <div className={`mt-6 p-4 rounded-lg ${
                revenueData.my_qualification.qualifies 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                <p className="text-sm font-medium text-center">
                  {revenueData.my_qualification.status_message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}