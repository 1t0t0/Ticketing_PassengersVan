// app/dashboard/users/components/UserCard.tsx - Fixed to render modals outside table structure
import React, { useState } from 'react';
import { FiEye, FiEdit2, FiTrash2, FiLogIn, FiLogOut } from 'react-icons/fi';
import { User } from '../types';
import useUserPermissions from '../hooks/useUserPermissions';
import useCheckInOut from '../hooks/useCheckinOut';
import GoogleAlphabetIcon from '@/components/GoogleAlphabetIcon';

interface UserCardProps {
  user: User;
  admins?: User[];
  onDelete: (userId: string, role: string, name: string) => void;
  onRefresh: () => void;
  onEdit?: (user: User) => void;  // Add callback for edit
  onView?: (user: User) => void;  // Add callback for view
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  admins = [], 
  onDelete, 
  onRefresh,
  onEdit,
  onView
}) => {
  const { canShowCheckInOutButton, canEditUser, canDeleteUser } = useUserPermissions();
  const { checkingInOut, handleCheckInOut } = useCheckInOut(onRefresh);
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

  // ตรวจสอบว่ามีรูปภาพที่ใช้งานได้หรือไม่
  const hasValidImage = user?.userImage && 
                       typeof user.userImage === 'string' && 
                       user.userImage.trim() !== '' &&
                       (user.userImage.startsWith('http') || user.userImage.startsWith('data:')) &&
                       !imageError;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(user);
    }
  };

  const handleViewClick = () => {
    if (onView) {
      onView(user);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="p-6">
        <div className="flex items-center">
          <div className="mr-4">
            {hasValidImage ? (
              <img 
                src={user.userImage} 
                alt={user.name} 
                className="w-16 h-16 rounded-full object-cover border-4 border-white"
                onError={handleImageError}
              />
            ) : (
              <GoogleAlphabetIcon 
                name={user.name} 
                size="xxl"
                className="border-4 border-white"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-lg text-gray-900 mb-1">{user.name}</div>
            <div className="text-sm text-gray-600 mb-1">{user.email}</div>
            {user.phone && (
              <div className="text-xs text-gray-500">{user.phone}</div>
            )}
          </div>
        </div>
      </td>
      
      <td className="p-6">
        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
          isDriver ? 'bg-blue-100 text-blue-800' :
          user.role === 'station' ? 'bg-green-100 text-green-800' :
          isStaffUser ? 'bg-purple-100 text-purple-800' :
          'bg-red-100 text-red-800'
        }`}>
          {getRoleText()}
        </span>
      </td>
      
      <td className="p-6">
        <div className="text-sm font-medium text-gray-900">
          {user.employeeId || user.stationId || '-'}
        </div>
      </td>
      
      <td className="p-6">
        {(isDriver || isStaffUser) && (
          <span className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full ${
            user.checkInStatus === 'checked-in' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
          </span>
        )}
      </td>
      
      <td className="p-6">
        <div className="flex space-x-2">
          {showCheckInOut && (
            <button
              onClick={() => handleCheckInOut(user._id!, user.checkInStatus || 'checked-out')}
              disabled={checkingInOut[user._id!]}
              className={`p-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${
                user.checkInStatus === 'checked-in' 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={checkingInOut[user._id!] ? 'ກຳລັງປະມວນຜົນ...' : (user.checkInStatus === 'checked-in' ? 'ອອກວຽກ' : 'ເຂົ້າວຽກ')}
            >
              {checkingInOut[user._id!] ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : user.checkInStatus === 'checked-in' ? (
                <FiLogOut size={16} />
              ) : (
                <FiLogIn size={16} />
              )}
            </button>
          )}
          
          <button 
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
            onClick={handleViewClick}
            title="ເບິ່ງລາຍລະອຽດ"
          >
            <FiEye size={16} />
          </button>
          
          {showEditButton && (
            <button 
              className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
              onClick={handleEditClick}
              title="ແກ້ໄຂຂໍ້ມູນ"
            >
              <FiEdit2 size={16} />
            </button>
          )}
          
          {showDeleteButton && (
            <button 
              className="p-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
              onClick={() => onDelete(user._id!, user.role, user.name)}
              title="ລຶບຂໍ້ມູນ"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserCard;