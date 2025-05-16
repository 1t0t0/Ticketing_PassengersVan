// app/dashboard/users/components/EditUserModal.tsx
import React, { useState, useEffect } from 'react';
import { fetchUserDetailed } from '../api/user';
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
  user: initialUser,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for form data
  const [userData, setUserData] = useState<Partial<User>>(initialUser);
  
  // State for image files and previews
  const [idCardImageFile, setIdCardImageFile] = useState<File | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [idCardImagePreview, setIdCardImagePreview] = useState<string | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  
  // โหลดข้อมูลผู้ใช้แบบละเอียด
  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoadingUser(true);
        if (initialUser._id) {
          const detailedUser = await fetchUserDetailed(initialUser._id);
          
          // ตั้งค่าพรีวิวของรูปภาพ
          if (detailedUser.idCardImage) {
            setIdCardImagePreview(detailedUser.idCardImage);
          }

          setUserData(detailedUser);

          
          if (detailedUser.userImage) {
            setUserImagePreview(detailedUser.userImage);
          }
        }
      } catch (error) {
        console.error('Failed to load user details:', error);
        notificationService.error('ບໍ່ສາມາດໂຫລດຂໍ້ມູນຜູ້ໃຊ້ໄດ້');
      } finally {
        setLoadingUser(false);
      }
    };
    
    loadUserDetails();
  }, [initialUser._id]);
  
  // จัดการการเปลี่ยนแปลงไฟล์รูปภาพ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (type === 'idCard') {
        setIdCardImageFile(file);
        // สร้าง URL ชั่วคราวสำหรับแสดงพรีวิว
        const previewUrl = URL.createObjectURL(file);
        setIdCardImagePreview(previewUrl);
      } else {
        setUserImageFile(file);
        // สร้าง URL ชั่วคราวสำหรับแสดงพรีวิว
        const previewUrl = URL.createObjectURL(file);
        setUserImagePreview(previewUrl);
      }
    }
  };
  
  // อัพเดทฟังก์ชั่นอัปโหลดรูปภาพ
  const uploadImage = async (file: File, type: 'idCard' | 'user') => {
    try {
      setUploadProgress(10);
      
      // สร้าง FormData สำหรับส่งไปยัง API
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      
      const response = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: formData
      });
      
      setUploadProgress(70);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      notificationService.error('ອັບໂຫລດຮູບບໍ່ສຳເລັດ');
      return null;
    }
  };
  
  // Update user data field
  const updateUser = (field: string, value: string | number) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // อัปโหลดรูปภาพใหม่ถ้ามี
      if (idCardImageFile) {
        const idCardImageUrl = await uploadImage(idCardImageFile, 'idCard');
        if (idCardImageUrl) {
          userData.idCardImage = idCardImageUrl;
        }
      }
      
      if (userImageFile) {
        const userImageUrl = await uploadImage(userImageFile, 'user');
        if (userImageUrl) {
          userData.userImage = userImageUrl;
        }
      }
      
      // เตรียมข้อมูลสำหรับอัพเดท
      const updateData: any = { ...userData };
      
      // ลบฟิลด์ที่ไม่ต้องการส่งไป API
      delete updateData._id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.unhashedPassword; // ลบฟิลด์ที่เราเพิ่มเอง
      
      // ถ้ามีการเปลี่ยนรหัสผ่าน
      if (userData.password && userData.password !== '********') {
        // ไม่ต้องแฮชรหัสผ่านที่นี่ เพราะจะทำในฝั่ง API
      } else {
        // ไม่มีการเปลี่ยนรหัสผ่าน
        delete updateData.password;
      }
      
      // เรียก API เพื่ออัพเดทข้อมูล
      const response = await fetch(`/api/users/${initialUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
      
      notificationService.success('บันทึกข้อมูลเรียบร้อยแล้ว');
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
    if (loadingUser) {
      return <div className="p-4 text-center">ກຳລັງໂຫລດຂໍ້ມູນ...</div>;
    }
    
    switch(initialUser.role) {
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
            idCardImagePreview={idCardImagePreview}
            userImagePreview={userImagePreview}
            isEditing={true}
            handleFileChange={handleFileChange}
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
            idCardImagePreview={idCardImagePreview}
            userImagePreview={userImagePreview}
            isEditing={true}
            handleFileChange={handleFileChange}
          />
        );
      case 'admin':
        return <AdminForm user={userData} updateUser={updateUser} isEditing={true} />;
      case 'station':
        return <StationForm user={userData} updateUser={updateUser} isEditing={true} />;
      default:
        return null;
    }
  };
  
  // แสดง loading indicator ขณะโหลดข้อมูล
  if (loadingUser) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">
            <p className="text-lg font-semibold">ກຳລັງໂຫລດຂໍ້ມູນ...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 backdrop-blur-sm  bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex justify-end items-center mb-4">
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