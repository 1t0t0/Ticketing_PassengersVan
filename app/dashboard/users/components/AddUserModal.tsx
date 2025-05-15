// app/dashboard/users/components/AddUserModal.tsx
import React, { useState } from 'react';
import NeoButton from '@/components/ui/NotionButton';
import { createUser } from '../api/user';
import notificationService from '@/lib/notificationService';
import { TABS } from '../config/constants';
import { DEFAULT_USER } from '../config/constants';
import useUserForm from '../hooks/useUserForm';
import { User, NewUser } from '../types';

import DriverForm from './forms/DriverForm';
import StaffForm from './forms/StaffForm';
import AdminForm from './forms/AdminForm';
import StationForm from './forms/StationForm';

interface AddUserModalProps {
  activeTab: 'drivers' | 'staff' | 'admin' | 'station';
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ 
  activeTab,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // ใช้ Custom hook สำหรับจัดการฟอร์ม
  const {
    user,
    updateUser,
    idCardImageFile,
    userImageFile,
    setIdCardImageFile,
    setUserImageFile,
    resetForm,
    validateForm
  } = useUserForm(activeTab);
  
  // ฟังก์ชันจำลองการอัปโหลดรูปภาพ (ในระบบจริงต้องเชื่อมต่อกับ API)
// app/dashboard/users/components/AddUserModal.tsx
// แก้ไขฟังก์ชัน uploadImage
const uploadImage = async (file: File, type: 'idCard' | 'user') => {
  try {
    setUploadProgress(10); // เริ่มต้นที่ 10%
    
    // สร้าง FormData สำหรับส่งไปยัง API
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    // แสดงข้อมูลการอัปโหลด
    console.log(`Uploading ${type} image:`, file.name, file.type, file.size);
    
    // อัปโหลดรูปภาพ
    const response = await fetch('/api/upload-cloudinary', {
      method: 'POST',
      body: formData
    });
    
    setUploadProgress(70); // อัปเดตความคืบหน้า
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload error response:', errorData);
      throw new Error(errorData.error || 'Upload failed');
    }
    
    const data = await response.json();
    console.log('Upload response:', data);
    
    setUploadProgress(100); // เสร็จสิ้นที่ 100%
    
    // ตรวจสอบการอัปโหลดสำเร็จ
    if (!data.success || !data.url) {
      throw new Error('Upload response invalid');
    }
    
    // ส่งคืน URL ของรูปภาพ
    return data.url;
  } catch (error) {
    console.error('Upload error:', error);
    notificationService.error('Failed to upload image. Using sample image instead.');
    
    // หากมีข้อผิดพลาด ใช้รูปภาพตัวอย่างแทน
    return type === 'idCard' 
      ? 'https://randomuser.me/api/portraits/lego/0.jpg'
      : 'https://randomuser.me/api/portraits/lego/1.jpg';
  }
};
  
  // ฟังก์ชันบันทึกข้อมูลผู้ใช้
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      const isValid = validateForm();
      if (!isValid) {
        return;
      }
      
      setLoading(true);
      
      // อัปโหลดรูปภาพ (ถ้ามี)
      let idCardImageUrl = '';
      let userImageUrl = '';
      
      if (idCardImageFile) {
        idCardImageUrl = await uploadImage(idCardImageFile, 'idCard');
      }
      
      if (userImageFile) {
        userImageUrl = await uploadImage(userImageFile, 'user');
      }
      
      // เตรียมข้อมูลผู้ใช้สำหรับส่งไปยัง API
      const userData: NewUser = {
        name: user.name,
        email: user.email,
        password: user.password || '',
        role: user.role,
        phone: user.phone,
      };
      
      // เพิ่มข้อมูลเฉพาะตามประเภทผู้ใช้
      if (user.role === 'driver' || user.role === 'staff') {
        userData.status = 'active';
        userData.checkInStatus = 'checked-out';
        userData.idCardNumber = user.idCardNumber;
        
        if (idCardImageUrl) {
          userData.idCardImage = idCardImageUrl;
        }
        
        if (userImageUrl) {
          userData.userImage = userImageUrl;
        }
      } else if (user.role === 'station') {
        userData.location = user.location;
      }
      
      // สร้างผู้ใช้
      await createUser(userData);
      
      // รีเซ็ตฟอร์มและรีเฟรชข้อมูล
      resetForm();
      onSuccess();
      onClose();
      
      // แสดงข้อความสำเร็จ
      notificationService.success(`ເພີ່ມ${TABS[activeTab]}ສຳເລັດແລ້ວ`);
      
    } catch (error: any) {
      console.error('Error adding user:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }

    
  };
  
  // เลือกฟอร์มตามประเภทผู้ใช้
  const renderForm = () => {
    switch (activeTab) {
      case 'drivers':
        return (
          <DriverForm 
            user={user}
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
            user={user}
            updateUser={updateUser}
            idCardImageFile={idCardImageFile}
            userImageFile={userImageFile}
            setIdCardImageFile={setIdCardImageFile}
            setUserImageFile={setUserImageFile}
            uploadProgress={uploadProgress}
          />
        );
      case 'admin':
        return <AdminForm user={user} updateUser={updateUser} />;
      case 'station':
        return <StationForm user={user} updateUser={updateUser} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">ເພີ່ມ{TABS[activeTab]}</h3>
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

export default AddUserModal;