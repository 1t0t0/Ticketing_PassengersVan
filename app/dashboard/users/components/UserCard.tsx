// app/dashboard/users/components/UserCard.tsx - Low Quality Version (Lao Language)
import React, { useState } from 'react';
import { User } from '../types';
import useUserPermissions from '../hooks/useUserPermissions';
import useCheckInOut from '../hooks/useCheckinOut';
import EditUserModal from './EditUserModal';
import ViewUserModal from './ViewUserModal';

interface UserCardProps {
  user: User;
  admins?: User[];
  onDelete: (userId: string, role: string, name: string) => void;
  onRefresh: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, admins = [], onDelete, onRefresh }) => {
  const { canShowCheckInOutButton, canEditUser, canDeleteUser } = useUserPermissions();
  const { checkingInOut, handleCheckInOut } = useCheckInOut(onRefresh);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const isDriver = user.role === 'driver';
  const isStaffUser = user.role === 'staff';
  const showCheckInOut = canShowCheckInOutButton(user);
  const showEditButton = canEditUser(user);
  const showDeleteButton = canDeleteUser(user) && !(user.role === 'admin' && admins.length <= 1);
  
  const getRoleText = () => {
    if (isDriver) return 'ຄົນຂັບລົດ';
    if (user.role === 'station') return 'ສະຖານີ';
    if (isStaffUser) return 'ພະນັກງານ';
    return 'ແອດມິນ';
  };

  // Check if user has valid image
  const hasValidImage = user?.userImage && 
                       typeof user.userImage === 'string' && 
                       user.userImage.trim() !== '' &&
                       (user.userImage.startsWith('http') || user.userImage.startsWith('data:')) &&
                       !imageError;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="p-3">
          <div className="flex items-center">
            <div className="w-10 h-10 mr-3 rounded-full overflow-hidden">
              {hasValidImage ? (
                <img 
                  src={user.userImage!} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  onLoad={() => setImageError(false)}
                />
              ) : (
                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="p-3">{getRoleText()}</td>
        <td className="p-3">
          {user.employeeId || user.stationId || '-'}
        </td>
        <td className="p-3">
          {(isDriver || isStaffUser) && (
            <span className={`px-2 py-1 text-xs rounded ${
              user.checkInStatus === 'checked-in' 
                ? 'bg-green-200 text-green-800' 
                : 'bg-red-200 text-red-800'
            }`}>
              {user.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
            </span>
          )}
        </td>
        <td className="p-3">
          <div className="flex space-x-1">
            {showCheckInOut && (
              <button
                onClick={() => handleCheckInOut(user._id!, user.checkInStatus || 'checked-out')}
                disabled={checkingInOut[user._id!]}
                className={`px-2 py-1 text-xs rounded ${
                  user.checkInStatus === 'checked-in' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}
              >
                {checkingInOut[user._id!] ? '...' : (user.checkInStatus === 'checked-in' ? 'ອອກ' : 'ເຂົ້າ')}
              </button>
            )}
            
            <button 
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
              onClick={() => setShowViewModal(true)}
            >
              ເບິ່ງ
            </button>
            
            {showEditButton && (
              <button 
                className="px-2 py-1 bg-yellow-500 text-white text-xs rounded"
                onClick={() => setShowEditModal(true)}
              >
                ແກ້ໄຂ
              </button>
            )}
            
            {showDeleteButton && (
              <button 
                className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                onClick={() => onDelete(user._id!, user.role, user.name)}
              >
                ລຶບ
              </button>
            )}
          </div>
        </td>
      </tr>

      {showEditModal && (
        <EditUserModal user={user} onClose={() => setShowEditModal(false)} onSuccess={onRefresh} />
      )}
      {showViewModal && (
        <ViewUserModal user={user} onClose={() => setShowViewModal(false)} />
      )}
    </>
  );
};

export default UserCard;