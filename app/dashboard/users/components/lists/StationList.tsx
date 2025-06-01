// app/dashboard/users/components/lists/StationList.tsx - Updated with Notification Service
import React, { useState } from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface StationListProps {
  stations: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const StationList: React.FC<StationListProps> = ({ stations, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDeleteStation = async (userId: string, role: string, name: string) => {
    showConfirmation(`ລຶບສະຖານີ ${name} ບໍ?`, async () => {
      try {
        setLoading(true);
        await deleteUser(userId);
        onRefresh();
        notificationService.success(`ລຶບສະຖານີ ${name} ສຳເລັດແລ້ວ`);
      } catch (error: any) {
        console.error('Error deleting station:', error);
        notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">ກຳລັງດຳເນີນການ...</span>
      </div>
    );
  }
  
  if (stations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">ບໍ່ພົບສະຖານີ</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ຜູ້ໃຊ້</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ຕຳແໜ່ງ</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ລະຫັດ</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ສະຖານະ</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ການດຳເນີນການ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {stations.map((station) => (
            <UserCard 
              key={station._id}
              user={station}
              onDelete={handleDeleteStation}
              onRefresh={onRefresh}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StationList;