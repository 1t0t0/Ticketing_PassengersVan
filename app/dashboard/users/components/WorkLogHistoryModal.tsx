// app/dashboard/users/components/WorkLogHistoryModal.tsx - Optimized
import React, { useState, useEffect } from 'react';
import { FiX, FiClock, FiLogIn, FiLogOut, FiRefreshCw, FiUser } from 'react-icons/fi';
import { User } from '../types';

interface WorkLog {
  _id: string;
  action: 'check-in' | 'check-out';
  timestamp: string;
}

interface WorkLogHistoryModalProps {
  user: User;
  onClose: () => void;
}

const WorkLogHistoryModal: React.FC<WorkLogHistoryModalProps> = ({ user, onClose }) => {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/work-logs/user/${user._id}?type=daily&date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setWorkLogs(data);
      } else {
        setWorkLogs([]);
      }
    } catch (error) {
      setWorkLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user._id) fetchWorkLogs();
  }, [user._id, selectedDate]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('lo-LA', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getActionIcon = (action: string) => (
    action === 'check-in' ? <FiLogIn className="text-green-500" size={16} /> : <FiLogOut className="text-red-500" size={16} />
  );

  const getActionText = (action: string) => (action === 'check-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ');

  const getActionBgColor = (action: string) => (
    action === 'check-in' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  );

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="bg-orange-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <FiClock className="mr-2" size={22} />
              ປະຫວັດການເຂົ້າວຽກ: {user.name}
            </h2>
            <button className="p-1 hover:bg-orange-600 rounded-full transition-colors" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>
          {user.employeeId && (
            <div className="mt-2 flex items-center text-orange-100">
              <FiUser className="mr-2" size={16} />
              <span className="text-sm">ລະຫັດພະນັກງານ: {user.employeeId}</span>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Date selector */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                onClick={fetchWorkLogs}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                disabled={loading}
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
                ໂຫລດຂໍ້ມູນໃໝ່
              </button>
            </div>
          </div>

          {/* Work logs display */}
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
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {workLogs.map((log, index) => (
                  <div key={log._id} className={`p-4 ${getActionBgColor(log.action)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getActionIcon(log.action)}
                        <div>
                          <div className="font-medium text-gray-900">{getActionText(log.action)}</div>
                          <div className="text-sm text-gray-600">{formatTime(log.timestamp)}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleDateString('lo-LA')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkLogHistoryModal;