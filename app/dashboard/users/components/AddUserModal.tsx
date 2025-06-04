// app/dashboard/users/components/AddUserModal.tsx - Updated to allow Staff add Drivers only
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
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

// เพิ่ม interface สำหรับข้อมูลรถ
interface CarData {
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: string;
}

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
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State สำหรับข้อมูลรถ (เฉพาะ Driver)
  const [carData, setCarData] = useState<CarData | null>(null);
  
  // Check if staff is trying to create non-driver user
  const isStaffCreatingNonDriver = session?.user?.role === 'staff' && activeTab !== 'drivers';
  
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
  
  // Show error if staff tries to create non-driver
  if (isStaffCreatingNonDriver) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">ไม่มีสิทธิ์</h3>
            <p className="text-gray-600 mb-6">
              พนักงานสามารถเพิ่มได้เฉพาะ <strong>คนขับรถ</strong> เท่านั้น
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ฟังก์ชันอัปโหลดรูปภาพ
  const uploadImage = async (file: File, type: 'idCard' | 'user') => {
    try {
      setUploadProgress(10);
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      
      console.log(`Uploading ${type} image:`, file.name, file.type, file.size);
      
      const response = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: formData
      });
      
      setUploadProgress(70);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      console.log('Upload response:', data);
      
      setUploadProgress(100);
      
      if (!data.success || !data.url) {
        throw new Error('Upload response invalid');
      }
      
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      notificationService.error('Failed to upload image. Using sample image instead.');
      
      return type === 'idCard' 
        ? 'https://randomuser.me/api/portraits/lego/0.jpg'
        : 'https://randomuser.me/api/portraits/lego/1.jpg';
    }
  };

  // ฟังก์ชันสร้างรถสำหรับคนขับ
  const createCarForDriver = async (driverId: string, carData: CarData) => {
    try {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_name: carData.car_name,
          car_capacity: carData.car_capacity,
          car_registration: carData.car_registration,
          car_type_id: carData.car_type_id,
          user_id: driverId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create car');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating car:', error);
      throw error;
    }
  };

  // ตรวจสอบข้อมูลรถสำหรับคนขับ
  const validateCarData = () => {
    if (activeTab !== 'drivers') return true;
    
    if (!carData || !carData.car_name || !carData.car_registration || !carData.car_type_id) {
      notificationService.error('ກະລຸນາກຣອກຂໍ້ມູນລົດໃຫ້ຄົບຖ້ວນ');
      return false;
    }
    
    return true;
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

      // ตรวจสอบข้อมูลรถสำหรับคนขับ
      const isCarDataValid = validateCarData();
      if (!isCarDataValid) {
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
        birthDate: user.birthDate,
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
      console.log('Creating user with data:', userData);
      const createdUser = await createUser(userData);
      console.log('User created successfully:', createdUser);
      
      // ถ้าเป็นคนขับ ให้สร้างข้อมูลรถด้วย
      if (user.role === 'driver' && carData && createdUser._id) {
        try {
          console.log('Creating car for driver:', carData);
          const createdCar = await createCarForDriver(createdUser._id, carData);
          console.log('Car created successfully:', createdCar);
          notificationService.success(`เพิ่ม${TABS[activeTab]}และรถสำเร็จแล้ว`);
        } catch (carError: any) {
          // ถ้าสร้างรถไม่สำเร็จ แต่ผู้ใช้สร้างสำเร็จแล้ว
          console.error('Car creation failed:', carError);
          notificationService.warning(`เพิ่ม${TABS[activeTab]}สำเร็จ แต่ไม่สามารถสร้างข้อมูลรถได้: ${carError.message}`);
        }
      } else {
        notificationService.success(`เพิ่ม${TABS[activeTab]}สำเร็จแล้ว`);
      }
      
      // รีเซ็ตฟอร์มและรีเฟรชข้อมูล
      resetForm();
      setCarData(null);
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error adding user:', error);
      notificationService.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  // จัดการการเปลี่ยนแปลงข้อมูลรถ
  const handleCarDataChange = (newCarData: CarData | null) => {
    setCarData(newCarData);
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
            onCarDataChange={handleCarDataChange}
            carData={carData}
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
  
  // Get title with permission info
  const getModalTitle = () => {
    let title = `เพิ่ม${TABS[activeTab]}`;
    if (session?.user?.role === 'staff' && activeTab === 'drivers') {
      title += ' (คุณมีสิทธิ์จัดการคนขับได้เต็มรูปแบบ)';
    }
    return title;
  };
  
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl mx-4 shadow-xl overflow-y-auto max-h-[95vh]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">{getModalTitle()}</h3>
            <button 
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
              onClick={onClose}
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {renderForm()}
            
            <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังบันทึก...
                  </div>
                ) : (
                  `บันทึก${TABS[activeTab]}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;