// app/dashboard/users/components/EditUserModal.tsx - Fixed for hydration
import React, { useState, useEffect } from 'react';
import { fetchUserDetailed } from '../api/user';
import notificationService from '@/lib/notificationService';
import { User } from '../types';
import { FiUser, FiSave, FiX, FiLoader } from 'react-icons/fi';

import DriverForm from './forms/DriverForm';
import StaffForm from './forms/StaffForm';
import AdminForm from './forms/AdminForm';
import StationForm from './forms/StationForm';

interface CarData {
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: string;
}

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
  const [mounted, setMounted] = useState(false);
  
  // State for form data
  const [userData, setUserData] = useState<Partial<User>>(initialUser);
  
  // State สำหรับข้อมูลรถ
  const [carData, setCarData] = useState<CarData | null>(null);
  const [loadingCarData, setLoadingCarData] = useState(false);
  
  // State for image files and previews
  const [idCardImageFile, setIdCardImageFile] = useState<File | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [idCardImagePreview, setIdCardImagePreview] = useState<string | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // ฟังก์ชันดึงข้อมูลรถของ Driver
  const fetchDriverCarData = async (driverId: string) => {
    try {
      setLoadingCarData(true);
      const response = await fetch(`/api/cars/by-driver/${driverId}`);
      if (response.ok) {
        const cars = await response.json();
        
        if (cars && cars.length > 0) {
          const firstCar = cars[0];
          
          let carTypeId = '';
          if (firstCar.car_type_id) {
            if (typeof firstCar.car_type_id === 'object' && firstCar.car_type_id._id) {
              carTypeId = firstCar.car_type_id._id;
            } else if (typeof firstCar.car_type_id === 'string') {
              carTypeId = firstCar.car_type_id;
            }
          }
          
          const carInfo: CarData = {
            car_name: firstCar.car_name || '',
            car_capacity: firstCar.car_capacity || 10,
            car_registration: firstCar.car_registration || '',
            car_type_id: carTypeId
          };
          
          setCarData(carInfo);
        } else {
          setCarData({
            car_name: '',
            car_capacity: 10,
            car_registration: '',
            car_type_id: ''
          });
        }
      } else {
        setCarData({
          car_name: '',
          car_capacity: 10,
          car_registration: '',
          car_type_id: ''
        });
      }
    } catch (error) {
      console.error('Error fetching driver car data:', error);
      setCarData({
        car_name: '',
        car_capacity: 10,
        car_registration: '',
        car_type_id: ''
      });
    } finally {
      setLoadingCarData(false);
    }
  };
  
useEffect(() => {
  if (!mounted) return;
  
  const loadUserDetails = async () => {
    try {
      setLoadingUser(true);
      if (initialUser._id) {
        const detailedUser = await fetchUserDetailed(initialUser._id);
        
        // จัดการวันที่ให้แสดงในรูปแบบที่ถูกต้อง
        if (detailedUser.birthDate) {
          try {
            let formattedDate = '';
            
            if (detailedUser.birthDate instanceof Date) {
              formattedDate = detailedUser.birthDate.toISOString().split('T')[0];
            } else if (typeof detailedUser.birthDate === 'string') {
              if (/^\d{4}-\d{2}-\d{2}$/.test(detailedUser.birthDate)) {
                formattedDate = detailedUser.birthDate;
              } else {
                const date = new Date(detailedUser.birthDate);
                if (!isNaN(date.getTime())) {
                  formattedDate = date.toISOString().split('T')[0];
                } else {
                  console.warn('Invalid date format:', detailedUser.birthDate);
                  formattedDate = '';
                }
              }
            }
            
            detailedUser.birthDate = formattedDate;
          } catch (dateError) {
            console.error('Error formatting birthDate in modal:', dateError);
            detailedUser.birthDate = '';
          }
        }
        
        // ตั้งค่าพรีวิวของรูปภาพ
        if (detailedUser.idCardImage) {
          setIdCardImagePreview(detailedUser.idCardImage);
        }
        if (detailedUser.userImage) {
          setUserImagePreview(detailedUser.userImage);
        }

        setUserData(detailedUser);
        
        // ถ้าเป็น driver ให้ดึงข้อมูลรถด้วย
        if (detailedUser.role === 'driver' && detailedUser._id) {
          await fetchDriverCarData(detailedUser._id);
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
}, [initialUser._id, mounted]);
  
  // จัดการการเปลี่ยนแปลงข้อมูลรถ
  const handleCarDataChange = (newCarData: CarData | null) => {
    setCarData(newCarData);
  };
  
  // จัดการการเปลี่ยนแปลงไฟล์รูปภาพ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (type === 'idCard') {
        setIdCardImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setIdCardImagePreview(previewUrl);
      } else {
        setUserImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setUserImagePreview(previewUrl);
      }
    }
  };

  // ฟังก์ชันลบรูปภาพ
  const handleRemoveImage = (type: 'idCard' | 'user') => {
    if (type === 'idCard') {
      setIdCardImageFile(null);
      setIdCardImagePreview(null);
      // ลบรูปเดิมออกจาก userData ด้วย
      setUserData(prev => ({ ...prev, idCardImage: '' }));
    } else {
      setUserImageFile(null);
      setUserImagePreview(null);
      // ลบรูปเดิมออกจาก userData ด้วย
      setUserData(prev => ({ ...prev, userImage: '' }));
    }
  };
  
  // อัพเดทฟังก์ชั่นอัปโหลดรูปภาพ
  const uploadImage = async (file: File, type: 'idCard' | 'user') => {
    try {
      setUploadProgress(10);
      
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
  
  // ฟังก์ชันอัปเดตข้อมูลรถ
  const updateCarData = async (carData: CarData) => {
    try {
      const carsResponse = await fetch(`/api/cars/by-driver/${initialUser._id}`);
      if (!carsResponse.ok) {
        throw new Error('Failed to fetch existing car data');
      }
      
      const existingCars = await carsResponse.json();
      
      if (existingCars && existingCars.length > 0) {
        const carId = existingCars[0]._id;
        
        const updatePayload = {
          car_name: carData.car_name,
          car_capacity: carData.car_capacity,
          car_registration: carData.car_registration,
          car_type_id: carData.car_type_id
        };
        
        const updateResponse = await fetch(`/api/cars/${carId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'Failed to update car');
        }
      } else {
        const createPayload = {
          car_name: carData.car_name,
          car_capacity: carData.car_capacity,
          car_registration: carData.car_registration,
          car_type_id: carData.car_type_id,
          user_id: initialUser._id
        };
        
        const createResponse = await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create car');
        }
      }
    } catch (error) {
      console.error('Error updating car data:', error);
      throw error;
    }
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
    
    // จัดการวันที่ก่อนส่ง API
    if (updateData.birthDate) {
      try {
        if (typeof updateData.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(updateData.birthDate)) {
          const date = new Date(updateData.birthDate + 'T00:00:00.000Z');
          if (!isNaN(date.getTime())) {
            updateData.birthDate = date.toISOString();
          }
        }
      } catch (dateError) {
        console.error('Error processing birthDate:', dateError);
        delete updateData.birthDate;
      }
    }
    
    // ลบฟิลด์ที่ไม่ต้องการส่งไป API
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.unhashedPassword;
    
    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (userData.password && userData.password !== '********') {
      // ไม่ต้องแฮชรหัสผ่านที่นี่ เพราะจะทำในฝั่ง API
    } else {
      delete updateData.password;
    }
    
    // เรียก API เพื่ออัพเดทข้อมูลผู้ใช้
    const response = await fetch(`/api/users/${initialUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    
    // ถ้าเป็น driver และมีข้อมูลรถ ให้อัปเดตข้อมูลรถด้วย
    if (initialUser.role === 'driver' && carData) {
      try {
        await updateCarData(carData);
        notificationService.success('ບັນທຶກຂໍ້ມູນຜູ້ໃຊ້ແລະລົດສຳເລັດແລ້ວ');
      } catch (carError) {
        console.error('Car update failed:', carError);
        notificationService.warning('ບັນທຶກຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ ແຕ່ບໍ່ສາມາດອັບເດດຂໍ້ມູນລົດໄດ້');
      }
    } else {
      notificationService.success('ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ');
    }
    
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
    if (loadingUser || loadingCarData) {
      return (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4">ກຳລັງໂຫລດຂໍ້ມູນ...</p>
        </div>
      );
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
            handleRemoveImage={handleRemoveImage}
            onCarDataChange={handleCarDataChange}
            carData={carData}
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
            handleRemoveImage={handleRemoveImage}
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

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl mx-4 shadow-xl overflow-y-auto max-h-[90vh] animate-fadeIn">
        {/* ส่วนหัว */}
        <div className="bg-blue-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <FiUser className="mr-2" size={22} />
              ແກ້ໄຂຂໍ້ມູນ: {initialUser.name}
            </h2>
            <button 
              className="p-1 hover:bg-blue-600 rounded-full transition-colors"
              onClick={onClose}
            >
              <FiX size={22} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {renderForm()}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
                disabled={loading}
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    ກຳລັງບັນທຶກ...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    ບັນທຶກ
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;