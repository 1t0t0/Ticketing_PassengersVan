// components/PassengerInfoCard.tsx - Enhanced Passenger Information Display
'use client';

import { FiClock, FiPhone, FiCreditCard, FiUser, FiUsers } from 'react-icons/fi';
import TicketTypeBadge from './TicketTypeBadge';

interface PassengerData {
  order: number;
  ticket_number: string;
  scanned_at: string;
  ticket_details: {
    id: string;
    price: number;
    payment_method: string;
    ticket_type: 'booking' | 'walk_in';
    ticket_type_lao: string;
    booking_details?: {
      passenger_name: string;
      passenger_phone: string;
      booking_number: string;
      total_passengers_in_booking: number;
      booking_amount: number;
    };
  };
}

interface PassengerInfoCardProps {
  passenger: PassengerData;
  isCompact?: boolean;
  showFullDetails?: boolean;
}

export default function PassengerInfoCard({ 
  passenger, 
  isCompact = false, 
  showFullDetails = false 
}: PassengerInfoCardProps) {
  
  const { ticket_details: ticketDetails } = passenger;
  const bookingDetails = ticketDetails?.booking_details;
  const isBookingTicket = ticketDetails?.ticket_type === 'booking';
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('lo-LA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => `₭${price.toLocaleString()}`;

  if (isCompact) {
    return (
      <div className={`p-3 rounded-lg border shadow-sm transition-all duration-200 ${
        isBookingTicket 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className={`font-medium px-2 py-1 rounded-full text-sm mr-3 ${
              isBookingTicket 
                ? 'text-blue-700 bg-blue-100' 
                : 'text-gray-700 bg-gray-100'
            }`}>
              #{passenger.order}
            </span>
            <div>
              <div className="flex items-center mb-1">
                <span className="font-bold text-gray-900 mr-2">
                  {passenger.ticket_number}
                </span>
                <TicketTypeBadge 
                  isFromBooking={isBookingTicket} 
                  size="sm" 
                />
              </div>
              {isBookingTicket && bookingDetails && (
                <div className="text-sm text-blue-700">
                  👤 {bookingDetails.passenger_name}
                </div>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-500 flex items-center">
            <FiClock className="mr-1" />
            {formatTime(passenger.scanned_at)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border shadow-sm transition-all duration-200 ${
      isBookingTicket 
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start flex-1">
          {/* Order Badge */}
          <span className={`font-medium px-3 py-1 rounded-full text-sm mr-3 flex-shrink-0 ${
            isBookingTicket 
              ? 'text-blue-700 bg-blue-100' 
              : 'text-gray-700 bg-gray-100'
          }`}>
            #{passenger.order}
          </span>
          
          <div className="flex-1 min-w-0">
            {/* Ticket Header */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="font-bold text-gray-900">
                {passenger.ticket_number}
              </span>
              <TicketTypeBadge 
                isFromBooking={isBookingTicket} 
                size="sm" 
              />
              <span className="text-sm text-gray-600">
                {formatPrice(ticketDetails?.price || 0)}
              </span>
            </div>
            
            {/* Booking Details */}
            {isBookingTicket && bookingDetails && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="space-y-2">
                  {/* Passenger Name */}
                  <div className="flex items-center text-sm">
                    <FiUser className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                    <span className="font-semibold text-blue-900">
                      {bookingDetails.passenger_name}
                    </span>
                  </div>
                  
                  {/* Contact & Booking Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700">
                    <div className="flex items-center">
                      <FiPhone className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{bookingDetails.passenger_phone}</span>
                    </div>
                    <div className="flex items-center">
                      <FiCreditCard className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{bookingDetails.booking_number}</span>
                    </div>
                  </div>
                  
                  {/* Group Booking Info */}
                  {bookingDetails.total_passengers_in_booking > 1 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-blue-600">
                        <FiUsers className="h-3 w-3 mr-1" />
                        <span>ຈອງລວມ {bookingDetails.total_passengers_in_booking} ຄົນ</span>
                      </div>
                      <div className="text-blue-700 font-medium">
                        {formatPrice(bookingDetails.booking_amount)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Additional Details (when showFullDetails is true) */}
            {showFullDetails && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">ວິທີຊຳລະ:</span> {ticketDetails?.payment_method}
                  </div>
                  <div>
                    <span className="font-medium">ID:</span> {ticketDetails?.id?.slice(-6)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Scan Time */}
        <div className="text-right ml-3 flex-shrink-0">
          <span className="text-sm text-gray-500 flex items-center">
            <FiClock className="mr-1" />
            {formatTime(passenger.scanned_at)}
          </span>
        </div>
      </div>
    </div>
  );
}