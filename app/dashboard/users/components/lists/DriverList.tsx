// app/dashboard/users/components/lists/DriverList.tsx - Fixed to handle modals outside table
import React, { useState } from 'react';
import UserCard from '../UserCard';
import EditUserModal from '../EditUserModal';
import ViewUserModal from '../ViewUserModal';
import { Driver, User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface DriverListProps {
  drivers: Driver[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const DriverList: React.FC<DriverListProps> = ({ drivers, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  
  const handleDeleteDriver = async (userId: string, role: string, name: string) => {
    showConfirmation(`ລຶບຄົນຂັບລົດ ${name} ບໍ? ຂໍ້ມູນລົດທີ່ເຊື່ອມໂຍງຈະຖືກລຶບຖິ້ມນຳ`, async () => {
      try {
        setLoading(true);
        await deleteUser(userId);
        onRefresh();
        notificationService.success(`ລຶບຄົນຂັບລົດ ${name} ສຳເລັດແລ້ວ`);
      } catch (error: any) {
        console.error('Error deleting driver:', error);
        notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
  };

  const handleView = (user: User) => {
    setViewUser(user);
  };

  const handleCloseModals = () => {
    setEditUser(null);
    setViewUser(null);
  };

  const handleSuccess = () => {
    onRefresh();
    handleCloseModals();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">ກຳລັງດຳເນີນການ...</span>
      </div>
    );
  }
  
  if (drivers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">ບໍ່ພົບຄົນຂັບລົດ</p>
      </div>
    );
  }
  
  return (
    <>
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
            {drivers.map((driver) => (
              <UserCard 
                key={driver._id}
                user={driver}
                onDelete={handleDeleteDriver}
                onRefresh={onRefresh}
                onEdit={handleEdit}
                onView={handleView}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals rendered outside the table structure */}
      {editUser && (
        <EditUserModal 
          user={editUser} 
          onClose={handleCloseModals} 
          onSuccess={handleSuccess} 
        />
      )}
      
      {viewUser && (
        <ViewUserModal 
          user={viewUser} 
          onClose={handleCloseModals} 
        />
      )}
    </>
  );
};

export default DriverList;