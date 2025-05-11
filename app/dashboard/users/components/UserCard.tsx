import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiMail, 
  FiPhone, 
  FiEdit2, 
  FiTrash2, 
  FiUser, 
  FiHome, 
  FiMapPin, 
  FiLogIn, 
  FiLogOut,
  FiTruck
} from 'react-icons/fi';
import NeoButton from '@/components/ui/NotionButton';

import { User, Driver } from '../types';
import useUserPermissions from '../hooks/useUserPermissions';
import useCheckInOut from '../hooks/useCheckinOut';

interface UserCardProps {
  user: User;
  admins?: User[];
  onDelete: (userId: string, role: string, name: string) => void;
  onRefresh: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  admins = [],
  onDelete,
  onRefresh
}) => {
  const router = useRouter();
  const { canShowCheckInOutButton, canEditUser, canDeleteUser } = useUserPermissions();
  const { checkingInOut, handleCheckInOut } = useCheckInOut(onRefresh);

  const isDriver = user.role === 'driver';
  const isStaffUser = user.role === 'staff';
  const isStation = user.role === 'station';
  const showCheckInOut = canShowCheckInOutButton(user);
  const showEditButton = canEditUser(user);
  const showDeleteButton = canDeleteUser(user) && !(user.role === 'admin' && admins.length <= 1);
  
  // ฟังก์ชันสำหรับการ check in/out และเรียกข้อมูลใหม่
  const handleUserCheckInOut = async (userId: string, currentStatus: string) => {
    await handleCheckInOut(userId, currentStatus);
    // เพิ่มการเรียก onRefresh เพื่ออัพเดท UI ทันที
    onRefresh();
  };
  
  // Get appropriate CSS classes based on user role
  const getRoleClasses = () => {
    if (isDriver) return { bg: 'bg-blue-100', text: 'text-blue-500' };
    if (isStation) return { bg: 'bg-yellow-100', text: 'text-yellow-500' };
    if (isStaffUser) return { bg: 'bg-green-100', text: 'text-green-500' };
    return { bg: 'bg-purple-100', text: 'text-purple-500' };
  };
  
  const { bg, text } = getRoleClasses();
  
  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <div className="p-4 flex flex-wrap items-center">
        {/* Avatar */}
        <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mr-4`}>
          {user.userImage ? (
            <img 
              src={user.userImage} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <FiUser size={24} className={text} />
          )}
        </div>
        
        {/* User main info */}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold truncate">{user.name}</div>
          
          {/* IDs */}
          {isDriver && (user as any).employeeId && (
            <div className="text-sm text-gray-500">ID: {(user as any).employeeId}</div>
          )}
          {isStaffUser && (user as any).employeeId && (
            <div className="text-sm text-gray-500">ID: {(user as any).employeeId}</div>
          )}
          {isStation && (user as any).stationId && (
            <div className="text-sm text-gray-500">ID: {(user as any).stationId}</div>
          )}
          
          {/* Location for stations */}
          {isStation && (user as any).location && (
            <div className="text-sm text-gray-500">
              <FiMapPin size={14} className="inline mr-1" />
              {(user as any).location}
            </div>
          )}
          
          {/* Check-in status badge */}
          {(isDriver || isStaffUser) && (
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                user.checkInStatus === 'checked-in' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {user.checkInStatus === 'checked-in' ? 'Checked-In' : 'Checked-Out'}
              </span>
            </div>
          )}
        </div>
        
        {/* Contact info */}
        <div className="flex items-center space-x-4 mr-4 flex-wrap">
          <div className="flex items-center m-2">
            <FiMail size={18} className="text-gray-400 mr-2" />
            <span>{user.email}</span>
          </div>
          
          {user.phone && (
            <div className="flex items-center m-2">
              <FiPhone size={18} className="text-gray-400 mr-2" />
              <span>{user.phone}</span>
            </div>
          )}
          
          {isStation && (user as any).stationName && (
            <div className="flex items-center m-2">
              <FiHome size={18} className="text-gray-400 mr-2" />
              <span>{(user as any).stationName}</span>
            </div>
          )}
          
          {isDriver && (user as Driver).assignedCar && (
            <div className="flex items-center m-2">
              <FiTruck size={18} className="text-gray-400 mr-2" />
              <span>
                {(user as Driver).assignedCar?.car_registration} 
                ({(user as Driver).assignedCar?.car_name})
              </span>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2 flex-wrap">
          {/* Check-in/Check-out button */}
          {showCheckInOut && (
            <div className="m-1">
              <NeoButton
                variant={user.checkInStatus === 'checked-in' ? 'danger' : 'success'}
                size="sm"
                onClick={() => handleUserCheckInOut(user._id!, user.checkInStatus || 'checked-out')}
                disabled={checkingInOut[user._id!]}
                className="flex items-center"
              >
                {checkingInOut[user._id!] ? (
                  'ກຳລັງດຳເນີນການ...' 
                ) : (
                  <>
                    {user.checkInStatus === 'checked-in' ? (
                      <>
                        <FiLogOut className="mr-1" /> Check Out
                      </>
                    ) : (
                      <>
                        <FiLogIn className="mr-1" /> Check In
                      </>
                    )}
                  </>
                )}
              </NeoButton>
            </div>
          )}
          
          {/* Edit button - Admin only */}
          {showEditButton && (
            <div className="m-1">
              <button 
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                onClick={() => router.push(`/dashboard/users/edit/${user._id}`)}
              >
                <FiEdit2 size={18} />
              </button>
            </div>
          )}
          
          {/* Delete button - Admin only */}
          {showDeleteButton && (
            <div className="m-1">
              <button 
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                onClick={() => onDelete(user._id!, user.role, user.name)}
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;