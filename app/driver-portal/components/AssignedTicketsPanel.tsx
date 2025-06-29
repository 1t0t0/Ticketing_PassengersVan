// app/driver-portal/components/AssignedTicketsPanel.tsx - Enhanced with Date Display & Delete Button
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
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
  FiCalendar
} from 'react-icons/fi';
import notificationService from '@/lib/notificationService';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [deletingTickets, setDeletingTickets] = useState<Set<string>>(new Set());

  // ✅ ดึงตั๋วที่ได้รับมอบหมาย
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAssignedTickets(data.tickets || []);
        setStats(data.stats || null);
        setDebugInfo(data.debug || null);
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

  // ✅ ฟังก์ชันลบตั๋ว (ยกเลิกการ assign)
  const handleDeleteTicket = async (ticketId: string, ticketNumber: string) => {
    if (!confirm(`ຢືນຢັນຍົກເລີກການມອບໝາຍປີ້ ${ticketNumber}?`)) {
      return;
    }

    try {
      setDeletingTickets(prev => new Set([...prev, ticketId]));
      
      console.log('🗑️ Deleting ticket assignment:', ticketId, ticketNumber);
      
      // ส่ง request ไป API เพื่อยกเลิกการ assign
      const response = await fetch(`/api/tickets/${ticketId}/assignment`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        notificationService.success(`ຍົກເລີກການມອບໝາຍປີ້ ${ticketNumber} ສຳເລັດ`);
        
        // รีเฟรชรายการ
        await fetchAssignedTickets(false);
      } else {
        throw new Error(result.error || 'Failed to remove ticket assignment');
      }
      
    } catch (error) {
      console.error('💥 Error deleting ticket assignment:', error);
      notificationService.error(
        error instanceof Error 
          ? error.message 
          : 'ເກີດຂໍ້ຜິດພາດໃນການຍົກເລີກການມອບໝາຍ'
      );
    } finally {
      setDeletingTickets(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (driverId) {
      fetchAssignedTickets();
    }
  }, [driverId, refreshTrigger, filter]);

  const handleRefresh = () => {
    fetchAssignedTickets(false);
  };

  // ✅ ฟังก์ชันฟอร์แมทวันที่แบบเต็ม
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // เช็คว่าเป็นวันไหน
    if (date.toDateString() === today.toDateString()) {
      return 'ມື້นີ້';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'ມື້ວານ';
    } else {
      return date.toLocaleDateString('lo-LA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('lo-LA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodText = (method: string) => {
    return method === 'cash' ? 'ເງິນສົດ' : 'QR';
  };

  // Filter tickets
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

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-gray-600 text-sm">ກຳລັງໂຫລດ...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiAlertTriangle className="text-red-600 mr-2 h-4 w-4" />
            <div>
              <h4 className="font-medium text-red-800 text-sm">ເກີດຂໍ້ຜິດພາດ</h4>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchAssignedTickets()}
            className="text-red-600 hover:text-red-800 underline text-xs"
          >
            ລອງໃໝ່
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* ✅ Compact Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Ticket className="h-4 w-4 mr-2" />
            <h3 className="text-sm font-semibold">ຕັ້ວທີ່ໄດ້ຮັບມອບໝາຍ</h3>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium ml-2">
              {filteredTickets.length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="ອັບເດດ"
            >
              <FiRefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isExpanded ? "ຫຍໍ້" : "ຂະຫຍາຍ"}
            >
              {isExpanded ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Compact Filter Tabs */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <div className="flex">
          {[
            { key: 'assigned', label: 'ລໍຖ້າ', icon: FiClock },
            { key: 'scanned', label: 'ສຳເລັດ', icon: FiCheckCircle },
            { key: 'all', label: 'ທັງໝົດ', icon: Ticket }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 flex items-center justify-center py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                filter === key
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="mr-1 h-3 w-3" />
              {label}
              {stats && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
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

      {/* ✅ Content Area */}
      <div className="p-3 flex-1 flex flex-col overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Ticket className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {filter === 'assigned' ? 'ບໍ່ມີຕັ້ວລໍຖ້າ' :
               filter === 'scanned' ? 'ຍັງບໍ່ໄດ້ສະແກນ' :
               'ບໍ່ມີຕັ້ວ'}
            </h3>
            <p className="text-xs text-gray-500">
              {filter === 'assigned' ? 'ຕັ້ວທີ່ລູກຄ້າເລືອກລົດຂອງທ່ານຈະປາກົດທີ່ນີ້' :
               filter === 'scanned' ? 'ຕັ້ວທີ່ທ່ານສະແກນແລ້ວຈະປາກົດທີ່ນີ້' :
               'ຕັ້ວທີ່ລູກຄ້າເລືອກລົດຂອງທ່ານຈະປາກົດທີ່ນີ້'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* ✅ Enhanced Ticket List with Date & Delete Button */}
            <div className={`space-y-2 overflow-y-auto flex-1 ${
              isExpanded ? '' : ''
            }`}>
              {(isExpanded ? filteredTickets : filteredTickets.slice(0, 2)).map((ticket) => (
                <div 
                  key={ticket._id} 
                  className={`border rounded-lg p-3 transition-all duration-200 ${
                    ticket.isScanned 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {/* ✅ Header Row - ห้ามแสดง Ticket Number + Delete Button */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="font-bold text-sm text-blue-600">
                        ປີ້ທີ່ໄດ້ຮັບມອບໝາຍ
                      </span>
                      {ticket.ticketType === 'group' && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          ກຸ່ມ
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {/* Status Badge */}
                      {ticket.isScanned ? (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                          ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium">
                          ⏳
                        </span>
                      )}
                      
                      {/* ✅ Delete Button - ปรากฏเฉพาะตั๋วที่ยังไม่ได้สแกน */}
                      {!ticket.isScanned && (
                        <button
                          onClick={() => handleDeleteTicket(ticket._id, ticket.ticketNumber)}
                          disabled={deletingTickets.has(ticket._id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                          title="ຍົກເລີກການມອບໝາຍ"
                        >
                          {deletingTickets.has(ticket._id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border border-red-500 border-t-transparent"></div>
                          ) : (
                            <FiTrash2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* ✅ Enhanced Info Grid - เพิ่มวันที่ */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                    <div className="flex items-center">
                      <FiUsers className="mr-1 h-3 w-3" />
                      <span>{ticket.passengerCount} ຄົນ</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="mr-1">💰</span>
                      <span>₭{ticket.price.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FiMapPin className="mr-1 h-3 w-3" />
                      <span className="truncate">{ticket.destination}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="mr-1">💳</span>
                      <span>{getPaymentMethodText(ticket.paymentMethod)}</span>
                    </div>
                  </div>

                  {/* ✅ Date Row - แสดงวันที่ขายและผู้ขาย */}
                  <div className="bg-gray-100 rounded p-2 mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center">
                        <FiCalendar className="mr-1 h-3 w-3" />
                        <span className="font-medium">
                          {formatFullDate(ticket.soldAt)}
                        </span>
                        <span className="ml-1 text-gray-500">
                          {formatTime(ticket.soldAt)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        ໂດຍ: {ticket.soldBy}
                      </div>
                    </div>
                  </div>

                  {/* ✅ Time Info */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center">
                        <FiClock className="mr-1 h-3 w-3" />
                        <span>
                          ມອບໝາຍ: {formatTime(ticket.assignedAt)}
                        </span>
                      </div>
                      
                      {ticket.isScanned && ticket.scannedAt && (
                        <div className="flex items-center text-green-600">
                          <FiCheckCircle className="mr-1 h-3 w-3" />
                          <span>
                            ສະແກນ: {formatTime(ticket.scannedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ Expand/Collapse Button */}
            {filteredTickets.length > 2 && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <FiEyeOff className="mr-1 h-3 w-3" />
                      ຫຍໍ້
                    </>
                  ) : (
                    <>
                      <FiEye className="mr-1 h-3 w-3" />
                      ເບິ່ງທັງໝົດ ({filteredTickets.length} ໃບ)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ✅ Compact Summary */}
            {stats && isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-orange-50 p-2 rounded text-center">
                    <div className="text-xs text-orange-600">ລໍຖ້າ</div>
                    <div className="font-bold text-sm text-orange-800">
                      {stats.assigned.count} ໃບ
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-xs text-green-600">ສຳເລັດ</div>
                    <div className="font-bold text-sm text-green-800">
                      {stats.scanned.count} ໃບ
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTicketsPanel;