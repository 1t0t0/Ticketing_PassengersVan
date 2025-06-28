// app/driver-portal/components/AssignedTicketsPanel.tsx - FIXED with debugging
'use client';

import { Ticket } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiMapPin, 
  FiClock, 
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiInfo
} from 'react-icons/fi';

interface AssignedTicket {
  _id: string;
  ticketNumber: string;
  ticketType: 'individual' | 'group';
  passengerCount: number;
  price: number;
  pricePerPerson: number;
  destination: string;
  soldAt: string;
  soldBy: string;
  paymentMethod: 'cash' | 'qr';
  isScanned: boolean;
  scannedAt?: string;
  assignedAt: string;
  assignedDriverId?: string;
}

interface AssignedTicketStats {
  assigned: {
    count: number;
    totalPassengers: number;
    totalRevenue: number;
  };
  scanned: {
    count: number;
    totalPassengers: number;
    totalRevenue: number;
  };
}

interface AssignedTicketsPanelProps {
  driverId: string;
  refreshTrigger?: number;
}

const AssignedTicketsPanel: React.FC<AssignedTicketsPanelProps> = ({ 
  driverId, 
  refreshTrigger = 0 
}) => {
  const [assignedTickets, setAssignedTickets] = useState<AssignedTicket[]>([]);
  const [stats, setStats] = useState<AssignedTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'scanned'>('assigned');
  const [showAll, setShowAll] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // ✅ ดึงตั๋วที่ได้รับมอบหมาย พร้อม debug
  const fetchAssignedTickets = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      console.log('🎫 Fetching assigned tickets for driver:', driverId, 'filter:', filter);
      
      const response = await fetch(`/api/driver/assigned-tickets?status=${filter}`);
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 API Response data:', data);
      
      if (data.success) {
        setAssignedTickets(data.tickets || []);
        setStats(data.stats || null);
        setDebugInfo(data.debug || null);
        
        console.log('✅ Assigned tickets loaded:', {
          ticketCount: data.tickets?.length || 0,
          filter: filter,
          driverId: driverId,
          stats: data.stats
        });
      } else {
        throw new Error(data.error || 'Failed to fetch assigned tickets');
      }
      
    } catch (error) {
      console.error('💥 Error fetching assigned tickets:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // เรียกใช้เมื่อ component mount หรือมีการ refresh
  useEffect(() => {
    if (driverId) {
      console.log('🔄 Effect triggered - fetching tickets:', { driverId, refreshTrigger, filter });
      fetchAssignedTickets();
    }
  }, [driverId, refreshTrigger, filter]);

  // Handle manual refresh
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchAssignedTickets(false);
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('lo-LA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('lo-LA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get payment method text
  const getPaymentMethodText = (method: string) => {
    return method === 'cash' ? 'ເງິນສົດ' : 'QR/ໂອນ';
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">ກຳລັງໂຫລດຕັ້ວທີ່ໄດ້ຮັບມອບໝາຍ...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-600 mr-2 h-5 w-5" />
            <div>
              <h4 className="font-medium text-red-800">ເກີດຂໍ້ຜິດພາດ</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="text-xs text-red-500 cursor-pointer">Debug Info</summary>
                  <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchAssignedTickets()}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            ລອງໃໝ່
          </button>
        </div>
      </div>
    );
  }

  // Filter tickets based on current filter
  const filteredTickets = assignedTickets.filter(ticket => {
    switch (filter) {
      case 'assigned':
        return !ticket.isScanned;
      case 'scanned':
        return ticket.isScanned;
      default:
        return true;
    }
  });

  // Display tickets (show 3 by default, all if showAll is true)
  const displayTickets = showAll ? filteredTickets : filteredTickets.slice(0, 3);
  const hasMoreTickets = filteredTickets.length > 3;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Ticket className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">ຕັ້ວທີ່ໄດ້ຮັບມອບໝາຍ</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {filteredTickets.length} ໃບ
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="ອັບເດດ"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 m-4">
          <div className="flex items-start">
            <FiInfo className="text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p><strong>Debug:</strong> กำลังค้นหาตั๋วที่มี assignedDriverId = {driverId}</p>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">รายละเอียด Debug</summary>
                <pre className="mt-2 text-xs bg-blue-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'assigned', label: 'ລໍຖ້າສະແກນ', icon: FiClock },
            { key: 'scanned', label: 'ສະແກນແລ້ວ', icon: FiCheckCircle },
            { key: 'all', label: 'ທັງໝົດ', icon: Ticket }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                filter === key
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
              {stats && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  filter === key 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {key === 'assigned' ? stats.assigned.count : 
                   key === 'scanned' ? stats.scanned.count : 
                   stats.assigned.count + stats.scanned.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'assigned' ? 'ບໍ່ມີຕັ້ວທີ່ລໍຖ້າສະແກນ' :
               filter === 'scanned' ? 'ຍັງບໍ່ໄດ້ສະແກນຕັ້ວໃດ' :
               'ບໍ່ມີຕັ້ວທີ່ໄດ້ຮັບມອບໝາຍ'}
            </h3>
            <p className="text-gray-600">
              {filter === 'assigned' ? 'ຕັ້ວທີ່ລູກຄ້າເລືອກລົດຂອງທ່ານຈະປາກົດທີ່ນີ້' :
               filter === 'scanned' ? 'ຕັ້ວທີ່ທ່ານສະແກນແລ້ວຈະປາກົດທີ່ນີ້' :
               'ຕັ້ວທີ່ລູກຄ້າເລືອກລົດຂອງທ່ານຈະປາກົດທີ່ນີ້'}
            </p>
            
            {/* Debug info for no tickets */}
            <div className="mt-4 text-xs text-gray-500">
              <p>Driver ID: {driverId}</p>
              <p>Total tickets in database: {assignedTickets.length}</p>
              <p>Current filter: {filter}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tickets List */}
            <div className="space-y-4">
              {displayTickets.map((ticket) => (
                <div 
                  key={ticket._id} 
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    ticket.isScanned 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="font-bold text-lg text-blue-600">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.ticketType === 'group' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.ticketType === 'group' ? 'ກຸ່ມ' : 'ເອກະຊົນ'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {ticket.isScanned ? (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                          ✅ ສະແກນແລ້ວ
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                          ⏳ ລໍຖ້າສະແກນ
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <FiUsers className="mr-2 h-4 w-4" />
                      <span>{ticket.passengerCount} ຄົນ</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">💰</span>
                      <span>₭{ticket.price.toLocaleString()}</span>
                      {ticket.ticketType === 'group' && (
                        <span className="ml-1 text-xs text-gray-500">
                          (₭{ticket.pricePerPerson.toLocaleString()}/ຄົນ)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="mr-2 h-4 w-4" />
                      <span>{ticket.destination}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">💳</span>
                      <span>{getPaymentMethodText(ticket.paymentMethod)}</span>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center">
                        <FiClock className="mr-1 h-3 w-3" />
                        <span>
                          ຂາຍເມື່ອ: {formatDate(ticket.soldAt)} {formatTime(ticket.soldAt)}
                        </span>
                      </div>
                      
                      {ticket.isScanned && ticket.scannedAt && (
                        <div className="flex items-center text-green-600">
                          <FiCheckCircle className="mr-1 h-3 w-3" />
                          <span>
                            ສະແກນເມື່ອ: {formatTime(ticket.scannedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      ຂາຍໂດຍ: {ticket.soldBy}
                    </div>
                    
                    {/* Assignment info */}
                    {ticket.assignedAt && (
                      <div className="text-xs text-blue-600 mt-1">
                        ມອບໝາຍເມື່ອ: {formatDate(ticket.assignedAt)} {formatTime(ticket.assignedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Show More/Less Button */}
            {hasMoreTickets && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showAll ? (
                    <>
                      <FiEyeOff className="mr-2 h-4 w-4" />
                      ເບິ່ງໜ້ອຍລົງ
                    </>
                  ) : (
                    <>
                      <FiEye className="mr-2 h-4 w-4" />
                      ເບິ່ງທັງໝົດ ({filteredTickets.length} ໃບ)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Summary Stats */}
            {stats && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">ສະຫຼຸບ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-xs text-orange-600 mb-1">ລໍຖ້າສະແກນ</div>
                    <div className="font-bold text-orange-800">
                      {stats.assigned.count} ໃບ ({stats.assigned.totalPassengers} ຄົນ)
                    </div>
                    <div className="text-xs text-orange-600">
                      ₭{stats.assigned.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-600 mb-1">ສະແກນແລ້ວ</div>
                    <div className="font-bold text-green-800">
                      {stats.scanned.count} ໃບ ({stats.scanned.totalPassengers} ຄົນ)
                    </div>
                    <div className="text-xs text-green-600">
                      ₭{stats.scanned.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AssignedTicketsPanel;