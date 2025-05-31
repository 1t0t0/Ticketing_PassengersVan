// app/dashboard/users/components/WorkLogHistoryModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiClock, 
  FiCalendar, 
  FiLogIn, 
  FiLogOut,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUser
} from 'react-icons/fi';
import { User } from '../types';

// Interface สำหรับ WorkLog
interface WorkLog {
  _id: string;
  user_id: string;
  action: 'check-in' | 'check-out';
  timestamp: string;
  date: string;
  actionText: string;
  formattedTime: string;
}

interface WorkLogHistoryModalProps {
  user: User;
  onClose: () => void;
}

const WorkLogHistoryModal: React.FC<WorkLogHistoryModalProps> = ({ 
  user,
  onClose
}) => {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]; // วันนี้
  });
  const [viewType, setViewType] = useState<'daily' | 'recent'>('daily');
  
  // ฟังก์ชันดึงข้อมูล WorkLog
  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      
      let url = `/api/work-logs/user/${user._id}?`;
      
      if (viewType === 'daily') {
        url += `type=daily&date=${selectedDate}`;
      } else {
        url += `type=recent&limit=50`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setWorkLogs(data);
      } else {
        console.error('Failed to fetch work logs');
        setWorkLogs([]);
      }
    } catch (error) {
      console.error('Error fetching work logs:', error);
      setWorkLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลเมื่อ component mount หรือเมื่อเปลี่ยน viewType, selectedDate
  useEffect(() => {
    if (user._id) {
      fetchWorkLogs();
    }
  }, [user._id, viewType, selectedDate]);

  // ฟังก์ชันเปลี่ยนวันที่
  const changeDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // ฟังก์ชันฟอร์แมตวันที่เป็นภาษาลาว
  const formatDateLao = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('lo-LA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // ฟังก์ชันฟอร์แมตเวลา
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('lo-LA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // ฟังก์ชันแสดงไอคอนตามการกระทำ
  const getActionIcon = (action: string) => {
    return action === 'check-in' ? (
      <FiLogIn className="text-green-500" size={16} />
    ) : (
      <FiLogOut className="text-red-500" size={16} />
    );
  };

  // ฟังก์ชันแสดงข้อความการกระทำ
  const getActionText = (action: string) => {
    return action === 'check-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ';
  };

  // ฟังก์ชันแสดงสีพื้นหลังตามการกระทำ
  const getActionBgColor = (action: string) => {
    return action === 'check-in' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 shadow-xl overflow-y-auto max-h-[90vh] animate-fadeIn">
        {/* ส่วนหัว */}
        <div className="bg-orange-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <FiClock className="mr-2" size={22} />
              ປະຫວັດການເຂົ້າວຽກ: {user.name}
            </h2>
            <button 
              className="p-1 hover:bg-orange-600 rounded-full transition-colors"
              onClick={onClose}
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* Employee ID */}
          {user.employeeId && (
            <div className="mt-2 flex items-center text-orange-100">
              <FiUser className="mr-2" size={16} />
              <span className="text-sm">ລະຫັດພະນັກງານ: {user.employeeId}</span>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* การเลือกประเภทการดู */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewType === 'daily' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewType('daily')}
              >
                ເບິ່ງຕາມວັນ
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewType === 'recent' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewType('recent')}
              >
                ປະຫວັດລ່າສຸດ
              </button>
            </div>

            <button
              onClick={fetchWorkLogs}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
              ໂຫລດຂໍ້ມູນໃໝ່
            </button>
          </div>

          {/* ส่วนเลือกวันที่ (แสดงเฉพาะเมื่อ viewType เป็น daily) */}
          {viewType === 'daily' && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => changeDate('prev')}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="ວັນກ່ອນໜ້າ"
                >
                  <FiChevronLeft size={18} />
                </button>

                <div className="flex items-center space-x-4">
                  <FiCalendar className="text-gray-600" size={20} />
                  <div className="text-center">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-center"
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      {formatDateLao(selectedDate)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => changeDate('next')}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="ວັນຖັດໄປ"
                  disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* แสดงข้อมูล WorkLog */}
          <div className="bg-white border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">ກຳລັງໂຫລດຂໍ້ມູນ...</span>
              </div>
            ) : workLogs.length === 0 ? (
              <div className="text-center py-12">
                <FiClock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">ບໍ່ມີປະຫວັດການເຂົ້າວຽກ</p>
                <p className="text-gray-400 text-sm mt-2">
                  {viewType === 'daily' 
                    ? `ໃນວັນທີ ${formatDateLao(selectedDate)}` 
                    : 'ໃນຊ່ວງເວລາທີ່ຜ່ານມາ'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {workLogs.map((log, index) => (
                  <div key={log._id} className={`p-4 ${getActionBgColor(log.action)} ${index === 0 ? 'rounded-t-lg' : ''} ${index === workLogs.length - 1 ? 'rounded-b-lg' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getActionIcon(log.action)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {getActionText(log.action)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(log.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleDateString('lo-LA')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* สถิติสรุป (แสดงเฉพาะเมื่อมีข้อมูล) */}
          {workLogs.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-3">ສະຫຼຸບ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {workLogs.filter(log => log.action === 'check-in').length}
                  </div>
                  <div className="text-sm text-blue-600">ຄັ້ງທີ່ເຂົ້າວຽກ</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {workLogs.filter(log => log.action === 'check-out').length}
                  </div>
                  <div className="text-sm text-red-600">ຄັ້ງທີ່ອອກວຽກ</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {workLogs.length}
                  </div>
                  <div className="text-sm text-gray-600">ລວມທັງໝົດ</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkLogHistoryModal;