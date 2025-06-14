// app/dashboard/users/components/lists/StaffList.tsx - Fixed to handle modals outside table
import React, { useState } from 'react';
import UserCard from '../UserCard';
import EditUserModal from '../EditUserModal';
import ViewUserModal from '../ViewUserModal';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface StaffListProps {
  staff: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const StaffList: React.FC<StaffListProps> = ({ staff, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  
  const handleDeleteStaff = async (userId: string, role: string, name: string) => {
    showConfirmation(`ລຶບພະນັກງານ ${name} ບໍ?`, async () => {
      try {
        setLoading(true);
        await deleteUser(userId);
        onRefresh();
        notificationService.success(`ລຶບພະນັກງານ ${name} ສຳເລັດແລ້ວ`);
      } catch (error: any) {
        console.error('Error deleting staff:', error);
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
  
  if (staff.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">ບໍ່ພົບພະນັກງານ</p>
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
            {staff.map((staffMember) => (
              <UserCard 
                key={staffMember._id}
                user={staffMember}
                onDelete={handleDeleteStaff}
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

export default StaffList;