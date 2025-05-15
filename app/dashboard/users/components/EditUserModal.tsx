// app/dashboard/users/components/EditUserModal.tsx
import React, { useState, useEffect } from 'react';
import NeoButton from '@/components/ui/NotionButton';
import notificationService from '@/lib/notificationService';
import { TABS } from '../config/constants';
import { User } from '../types';

import DriverForm from './forms/DriverForm';
import StaffForm from './forms/StaffForm';
import AdminForm from './forms/AdminForm';
import StationForm from './forms/StationForm';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ 
  user,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for form data
  const [userData, setUserData] = useState<Partial<User>>(user);
  
  // State for image files
  const [idCardImageFile, setIdCardImageFile] = useState<File | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  
  // Update user data field
  const updateUser = (field: string, value: string | number) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };
  
  // Simulate file upload
  const uploadImage = async (file: File, type: 'idCard' | 'user') => {
    // Simulate an upload - in a real app you would post to an API
    return new Promise<string>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          // Return a fake URL or the existing URL
          resolve(type === 'idCard' ? 
            userData.idCardImage || `https://example.com/images/idCard-${Date.now()}.jpg` : 
            userData.userImage || `https://example.com/images/user-${Date.now()}.jpg`);
        }
      }, 100);
    });
  };
  
  // Validate form based on role
  const validateForm = () => {
    // Basic validation
    if (!userData.name || !userData.email) {
      notificationService.error('ກະລຸນາກວດສອບຂໍ້ມູນທີ່ຈຳເປັນ');
      return false;
    }
    
    // Role-specific validation
    if (userData.role === 'driver') {
      if (!userData.idCardNumber) {
        notificationService.error('ກະລຸນາກວດສອບຂໍ້ມູນຄົນຂັບລົດທີ່ຈຳເປັນ');
        return false;
      }
    } else if (userData.role === 'staff') {
      if (!userData.idCardNumber) {
        notificationService.error('ກະລຸນາລະບຸເລກບັດປະຈຳຕົວ');
        return false;
      }
    } else if (userData.role === 'station') {
      if (!userData.location) {
        notificationService.error('ກະລຸນາລະບຸທີ່ຕັ້ງສະຖານີ');
        return false;
      }
    }
    
    return true;
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!validateForm()) {
        return;
      }
      
      setLoading(true);
      
      // Upload images if needed
      if (idCardImageFile) {
        const idCardImageUrl = await uploadImage(idCardImageFile, 'idCard');
        userData.idCardImage = idCardImageUrl;
      }
      
      if (userImageFile) {
        const userImageUrl = await uploadImage(userImageFile, 'user');
        userData.userImage = userImageUrl;
      }
      
      // Prepare API payload
      const payload: any = { ...userData };
      
      // Remove sensitive or unnecessary fields
      delete payload.password;
      
      // Call update API
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      // Success
      notificationService.success(`ແກ້ໄຂຂໍ້ມູນສຳເລັດແລ້ວ`);
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  // Render appropriate form based on user role
  const renderForm = () => {
    switch (user.role) {
      case 'driver':
        return (
          <DriverForm 
            user={userData}
            updateUser={updateUser}
            idCardImageFile={idCardImageFile}
            userImageFile={userImageFile}
            setIdCardImageFile={setIdCardImageFile}
            setUserImageFile={setUserImageFile}
            uploadProgress={uploadProgress}
          />
        );
      case 'staff':
        return (
          <StaffForm 
            user={userData}
            updateUser={updateUser}
            idCardImageFile={idCardImageFile}
            userImageFile={userImageFile}
            setIdCardImageFile={setIdCardImageFile}
            setUserImageFile={setUserImageFile}
            uploadProgress={uploadProgress}
          />
        );
      case 'admin':
        return <AdminForm user={userData} updateUser={updateUser} />;
      case 'station':
        return <StationForm user={userData} updateUser={updateUser} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ແກ້ໄຂຂໍ້ມູນ {TABS[user.role as keyof typeof TABS]}</h3>
            <button 
              className="text-gray-500 hover:text-gray-700 text-xl"
              onClick={onClose}
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {renderForm()}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                onClick={onClose}
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;