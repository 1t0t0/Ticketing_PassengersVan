// app/driver-portal/components/DriverBookingStatus.tsx
// Copy ทั้งหมดจาก driver-booking-status artifact มาใส่ตรงนี้
import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, 
  FiUsers, 
  FiPlay, 
  FiSquare, 
  FiClock, 
  FiMapPin,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';

interface BookingData {
  booking_id: string;
  status: 'booked' | 'in_trip' | 'completed' | 'cancelled';
  booked_passengers: number;
  car_capacity: number;
  remaining_capacity: number;
  booking_date: string;
  expected_departure?: string;
  notes?: string;
  tickets: Array<{
    ticket_number: string;
    passenger_count: number;
    ticket_type: 'individual' | 'group';
  }>;
  car_id: {
    car_registration: string;
    car_name: string;
    car_capacity: number;
  };
}

interface DriverBookingStatusProps {
  driverId: string;
  onBookingAction?: (action: string, bookingId: string) => void;
  refreshTrigger?: number;
}

const DriverBookingStatus: React.FC<DriverBookingStatusProps> = ({ 
  driverId, 
  onBookingAction,
  refreshTrigger = 0 
}) => {
  const [bookingData, setBookingData] = useState<{
    activeBooking: BookingData | null;
    hasActiveBooking: boolean;
    currentStatus: string;
    stats: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch booking data
  const fetchBookingData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/driver/booking?status=active');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBookingData(data);
      } else {
        throw new Error(data.error || 'Failed to fetch booking data');
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh trigger
  useEffect(() => {
    fetchBookingData();
  }, [driverId, refreshTrigger]);

  // Auto refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchBookingData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Handle booking actions
  const handleBookingAction = async (action: string, bookingId: string) => {
    setActionLoading(action);
    
    try {
      const response = await fetch('/api/driver/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          booking_id: bookingId,
          actual_passengers: bookingData?.activeBooking?.booked_passengers // Use booked passengers as actual
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data
        await fetchBookingData();
        
        // Call parent callback if provided
        if (onBookingAction) {
          onBookingAction(action, bookingId);
        }
      } else {
        throw new Error(result.error || 'Action failed');
      }
    } catch (error) {
      console.error('Booking action error:', error);
      setError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('lo-LA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate occupancy percentage
  const getOccupancyPercentage = (booked: number, capacity: number) => {
    return Math.round((booked / capacity) * 100);
  };

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'booked':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: FiCalendar,
          text: 'ມີການຈອງ'
        };
      case 'in_trip':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: FiPlay,
          text: 'ກຳລັງເດີນທາງ'
        };
      case 'completed':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: FiCheckCircle,
          text: 'ສຳເລັດ'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: FiX,
          text: 'ຍົກເລີກ'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: FiClock,
          text: 'ບໍ່ຮູ້ສະຖານະ'
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">ກຳລັງໂຫລດຂໍ້ມູນການຈອງ...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiAlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">ເກີດຂໍ້ຜິດພາດ: {error}</span>
          </div>
          <button
            onClick={fetchBookingData}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            ລອງໃໝ່
          </button>
        </div>
      </div>
    );
  }

  // No active booking
  if (!bookingData?.hasActiveBooking || !bookingData?.activeBooking) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ບໍ່ມີການຈອງ</h3>
          <p className="text-gray-600 mb-4">
            ປັດຈຸບັນລົດຂອງທ່ານຍັງບໍ່ມີການຈອງຈາກລູກຄ້າ
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <FiRefreshCw className="h-4 w-4" />
            <span>ລະບົບຈະອັບເດດອັດຕະໂນມັດ</span>
          </div>
        </div>
      </div>
    );
  }

  const booking = bookingData.activeBooking;
  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;
  const occupancyPercentage = getOccupancyPercentage(booking.booked_passengers, booking.car_capacity);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiCalendar className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">ການຈອງປັດຈຸບັນ</h3>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color.replace('bg-', 'bg-white/20 ').replace('text-', 'text-white ').replace('border-', 'border-white/30 ')}`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {statusInfo.text}
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-6">
        {/* Booking ID and Car Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <FiCalendar className="mr-2 text-blue-600" />
              ຂໍ້ມູນການຈອງ
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ລະຫັດຊອງ:</span>
                <span className="font-medium">{booking.booking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ວັນທີ່ຈອງ:</span>
                <span className="font-medium">{formatDate(booking.booking_date)}</span>
              </div>
              {booking.expected_departure && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ເວລາອອກທີ່ຄາດ:</span>
                  <span className="font-medium text-blue-600">{formatDate(booking.expected_departure)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <FiUsers className="mr-2 text-green-600" />
              ຂໍ້ມູນຜູ້ໂດຍສານ
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ຈຳນວນທີ່ຈອງ:</span>
                <span className="font-bold text-blue-600">{booking.booked_passengers} ຄົນ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ທີ່ນັ່ງເຫຼືອ:</span>
                <span className="font-medium text-green-600">{booking.remaining_capacity} ຄົນ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ຄວາມຈຸລົດ:</span>
                <span className="font-medium">{booking.car_capacity} ຄົນ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">ອັດຕາການຈອງ</span>
            <span className="text-sm font-bold text-gray-900">{occupancyPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                occupancyPercentage >= 80 ? 'bg-green-500' : 
                occupancyPercentage >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{booking.booked_passengers} ຄົນ</span>
            <span>{booking.car_capacity} ຄົນ</span>
          </div>
        </div>

        {/* Tickets Information */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FiMapPin className="mr-2 text-purple-600" />
            ຂໍ້ມູນປີ້ ({booking.tickets.length} ໃບ)
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            <div className="space-y-2">
              {booking.tickets.map((ticket, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                  <div className="flex items-center">
                    <span className="font-medium text-blue-600">{ticket.ticket_number}</span>
                    <span className="ml-2 text-gray-500">
                      ({ticket.ticket_type === 'group' ? 'ກຸ່ມ' : 'ເອກະຊົນ'})
                    </span>
                  </div>
                  <span className="font-medium text-gray-700">{ticket.passenger_count} ຄົນ</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">ໝາຍເຫດ</h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">{booking.notes}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {booking.status === 'booked' && (
            <>
              <button
                onClick={() => handleBookingAction('start_trip', booking.booking_id)}
                disabled={actionLoading === 'start_trip'}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {actionLoading === 'start_trip' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ກຳລັງເລີ່ມ...
                  </>
                ) : (
                  <>
                    <FiPlay className="mr-2" />
                    ເລີ່ມການເດີນທາງ
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleBookingAction('cancel', booking.booking_id)}
                disabled={actionLoading === 'cancel'}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {actionLoading === 'cancel' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ກຳລັງຍົກເລີກ...
                  </>
                ) : (
                  <>
                    <FiX className="mr-2" />
                    ຍົກເລີກການຈອງ
                  </>
                )}
              </button>
            </>
          )}

          {booking.status === 'in_trip' && (
            <button
              onClick={() => handleBookingAction('complete_trip', booking.booking_id)}
              disabled={actionLoading === 'complete_trip'}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {actionLoading === 'complete_trip' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ກຳລັງສຳເລັດ...
                </>
              ) : (
                <>
                  <FiSquare className="mr-2" />
                  ສຳເລັດການເດີນທາງ
                </>
              )}
            </button>
          )}

          {(booking.status === 'completed' || booking.status === 'cancelled') && (
            <div className="text-center py-4">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                <StatusIcon className="mr-2" />
                ການຈອງນີ້{booking.status === 'completed' ? 'ສຳເລັດແລ້ວ' : 'ຖືກຍົກເລີກ'}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchBookingData}
            disabled={loading}
            className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
            title="ອັບເດດຂໍ້ມູນ"
          >
            <FiRefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            ອັບເດດ
          </button>
        </div>

        {/* Status Messages */}
        {booking.status === 'booked' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>ຄຳແນະນຳ:</strong> ກົດ "ເລີ່ມການເດີນທາງ" ເມື່ອພ້ອມຈະອອກເດີນທາງ
            </p>
          </div>
        )}

        {booking.status === 'in_trip' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              🚗 <strong>ກຳລັງເດີນທາງ:</strong> ກົດ "ສຳເລັດການເດີນທາງ" ເມື່ອເດີນທາງສຳເລັດ
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverBookingStatus;