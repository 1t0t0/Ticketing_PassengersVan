// app/dashboard/users/components/forms/DriverForm.tsx - Enhanced with Car Information
import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiCreditCard,
  FiCamera,
  FiX,
  FiRefreshCw,
  FiTruck,
  FiSettings,
  FiPlus
} from 'react-icons/fi';

import FormField from './FormField';
import { User } from '../../types';
import { resetUserPassword } from '../../api/user';
import notificationService from '@/lib/notificationService';

// เพิ่ม interfaces สำหรับ Car และ CarType
interface CarType {
  _id: string;
  carType_id: string;
  carType_name: string;
}

interface CarData {
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: string;
}

interface DriverFormProps {
  user: Partial<User>;
  updateUser: (field: string, value: string | number) => void;
  idCardImageFile: File | null;
  userImageFile: File | null;
  setIdCardImageFile: (file: File | null) => void;
  setUserImageFile: (file: File | null) => void;
  uploadProgress: number;
  idCardImagePreview?: string | null;
  userImagePreview?: string | null;
  isEditing?: boolean;
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => void;
  // เพิ่ม props สำหรับข้อมูลรถ
  onCarDataChange?: (carData: CarData | null) => void;
  carData?: CarData | null;
}

const DriverForm: React.FC<DriverFormProps> = ({
  user,
  updateUser,
  idCardImageFile,
  userImageFile,
  setIdCardImageFile,
  setUserImageFile,
  uploadProgress,
  idCardImagePreview,
  userImagePreview,
  isEditing = false,
  handleFileChange,
  onCarDataChange,
  carData: initialCarData
}) => {
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  // State สำหรับข้อมูลรถ
  const [carData, setCarData] = useState<CarData>(initialCarData || {
    car_name: '',
    car_capacity: 10,
    car_registration: '',
    car_type_id: ''
  });
  
  // State สำหรับประเภทรถ
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loadingCarTypes, setLoadingCarTypes] = useState(false);
  
  // State สำหรับการเพิ่มประเภทรถใหม่
  const [showAddCarType, setShowAddCarType] = useState(false);
  const [newCarTypeName, setNewCarTypeName] = useState('');
  const [addingCarType, setAddingCarType] = useState(false);

  // โหลดประเภทรถเมื่อ component mount
  useEffect(() => {
    fetchCarTypes();
  }, []);

  // ฟังก์ชันดึงข้อมูลประเภทรถ
  const fetchCarTypes = async () => {
    try {
      setLoadingCarTypes(true);
      const response = await fetch('/api/car-types');
      if (response.ok) {
        const data = await response.json();
        setCarTypes(data);
      }
    } catch (error) {
      console.error('Error fetching car types:', error);
      notificationService.error('ไม่สามารถโหลดประเภทรถได้');
    } finally {
      setLoadingCarTypes(false);
    }
  };

  // ฟังก์ชันเพิ่มประเภทรถใหม่
  const handleAddCarType = async () => {
    if (!newCarTypeName.trim()) {
      notificationService.error('กรุณากรอกชื่อประเภทรถ');
      return;
    }

    try {
      setAddingCarType(true);
      const response = await fetch('/api/car-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carType_name: newCarTypeName.trim() })
      });

      if (response.ok) {
        const newCarType = await response.json();
        setCarTypes(prev => [...prev, newCarType]);
        setCarData(prev => ({ ...prev, car_type_id: newCarType._id }));
        setNewCarTypeName('');
        setShowAddCarType(false);
        notificationService.success('เพิ่มประเภทรถสำเร็จ');
      } else {
        throw new Error('Failed to add car type');
      }
    } catch (error) {
      console.error('Error adding car type:', error);
      notificationService.error('ไม่สามารถเพิ่มประเภทรถได้');
    } finally {
      setAddingCarType(false);
    }
  };

  // อัปเดตข้อมูลรถและแจ้งให้ parent component ทราบ
  const updateCarData = (field: keyof CarData, value: string | number) => {
    const updatedCarData = { ...carData, [field]: value };
    setCarData(updatedCarData);
    if (onCarDataChange) {
      onCarDataChange(updatedCarData);
    }
  };

  const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.substring(0, 10);
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().substring(0, 10);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
    
    return '';
  };

  const handleResetPassword = async () => {
    if (!user._id) return;
    
    try {
      setResetPasswordLoading(true);
      
      const response = await resetUserPassword(user._id);
      setTempPassword(response.temporaryPassword);
      setShowTempPassword(true);
      updateUser('password', response.temporaryPassword);
      
      notificationService.success('รีเซ็ตรหัสผ่านสำเร็จ');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      notificationService.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setResetPasswordLoading(false);
    }
  };
  
  const defaultHandleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (type === 'idCard') {
        setIdCardImageFile(file);
      } else {
        setUserImageFile(file);
      }
    }
  };
  
  const fileChangeHandler = handleFileChange || defaultHandleFileChange;

  return (
    <>
      {/* ข้อมูลทั่วไป */}
      <div className="mb-6">
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiUser className="inline mr-2" />
          ข้อมูลทั่วไป
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="ชื่อ และ นามสกุล"
            type="text"
            icon={<FiUser />}
            value={user.name || ''}
            onChange={(e) => updateUser('name', e.target.value)}
            required
          />
          
          <FormField 
            label="วันเดือนปีเกิด"
            type="date"
            icon={<FiCalendar />}
            value={formatDateForInput(user.birthDate)}
            onChange={(e) => updateUser('birthDate', e.target.value)}
            required
          />
          
          <FormField 
            label="อีเมล"
            type="email"
            icon={<FiMail />}
            value={user.email || ''}
            onChange={(e) => updateUser('email', e.target.value)}
            required
          />
          
          <FormField 
            label="เบอร์โทรศัพท์"
            type="tel"
            icon={<FiPhone />}
            placeholder="0812345678"
            value={user.phone || ''}
            onChange={(e) => updateUser('phone', e.target.value)}
          />
          
          {/* รหัสผ่าน */}
          <div>
            <label className="block text-sm font-bold mb-2">รหัสผ่าน</label>
            <div className="relative">
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded p-2 pr-10 focus:border-blue-500 focus:outline-none"
                value={user.password || ''}
                onChange={(e) => updateUser('password', e.target.value)}
                placeholder={isEditing ? "ใส่รหัสผ่านใหม่หรือปล่อยว่างไว้เพื่อใช้รหัสผ่านเดิม" : "รหัสผ่าน"}
              />
              {isEditing && (
                <button
                  type="button"
                  className="absolute right-2 top-2 text-blue-500 hover:text-blue-700 transition-colors"
                  onClick={handleResetPassword}
                  disabled={resetPasswordLoading}
                >
                  <FiRefreshCw size={18} className={resetPasswordLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            {showTempPassword && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                <p className="text-sm text-yellow-800">
                  รหัสผ่านชั่วคราว: <strong>{tempPassword}</strong>
                </p>
              </div>
            )}
          </div>

          <FormField 
            label="เลขบัตรประจำตัว"
            type="text"
            icon={<FiCreditCard />}
            value={user.idCardNumber || ''}
            onChange={(e) => updateUser('idCardNumber', e.target.value)}
            required
          />
        </div>
      </div>
      
      {/* รูปภาพ */}
      <div className="mb-6 border-t border-gray-200 pt-6">
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiCamera className="inline mr-2" />
          รูปภาพ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* รูปบัตรประจำตัว */}
          <div>
            <label className="block text-sm font-bold mb-2">รูปบัตรประจำตัว</label>
            <div className="flex items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="idCardImage"
                onChange={(e) => fileChangeHandler(e, 'idCard')}
              />
              <label
                htmlFor="idCardImage"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                {idCardImageFile || idCardImagePreview ? (
                  <div className="text-center relative w-full h-full">
                    <img 
                      src={idCardImageFile 
                        ? URL.createObjectURL(idCardImageFile) 
                        : idCardImagePreview || ''}
                      alt="ID Card Preview" 
                      className="w-full h-full object-contain p-2 rounded"
                    />
                    <button 
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setIdCardImageFile(null);
                        if (idCardImageFile && URL.createObjectURL) {
                          URL.revokeObjectURL(URL.createObjectURL(idCardImageFile));
                        }
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FiCamera className="mx-auto text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">อัปโหลดรูปบัตรประจำตัว</p>
                    <p className="text-xs text-gray-400 mt-1">คลิกเพื่อเลือกไฟล์</p>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          {/* รูปถ่าย */}
          <div>
            <label className="block text-sm font-bold mb-2">รูปถ่าย</label>
            <div className="flex items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="userImage"
                onChange={(e) => fileChangeHandler(e, 'user')}
              />
              <label
                htmlFor="userImage"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                {userImageFile || userImagePreview ? (
                  <div className="text-center relative w-full h-full">
                    <img 
                      src={userImageFile 
                        ? URL.createObjectURL(userImageFile) 
                        : userImagePreview || ''}
                      alt="User Photo Preview" 
                      className="w-full h-full object-contain p-2 rounded"
                    />
                    <button 
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setUserImageFile(null);
                        if (userImageFile && URL.createObjectURL) {
                          URL.revokeObjectURL(URL.createObjectURL(userImageFile));
                        }
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FiCamera className="mx-auto text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">อัปโหลดรูปถ่าย</p>
                    <p className="text-xs text-gray-400 mt-1">คลิกเพื่อเลือกไฟล์</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
        
        {/* Upload progress bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">กำลังอัปโหลด: {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* ข้อมูลรถ */}
      <div className="mb-6 border-t border-gray-200 pt-6">
        <h4 className="font-semibold text-lg mb-4 text-green-600 border-b border-green-200 pb-2">
          <FiTruck className="inline mr-2" />
          ข้อมูลรถ
        </h4>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-700">
            <FiSettings className="inline mr-1" />
            กรุณากรอกข้อมูลรถที่คนขับคนนี้จะรับผิดชอบ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="ชื่อรถ / รุ่นรถ"
            type="text"
            icon={<FiTruck />}
            value={carData.car_name}
            onChange={(e) => updateCarData('car_name', e.target.value)}
            placeholder="Toyota Commuter, Isuzu D-Max, etc."
            required
          />

          <FormField 
            label="ความจุรถ (จำนวนที่นั่ง)"
            type="number"
            icon={<FiUser />}
            value={carData.car_capacity.toString()}
            onChange={(e) => updateCarData('car_capacity', parseInt(e.target.value) || 10)}
            min="1"
            required
          />

          <FormField 
            label="หมายเลขทะเบียนรถ"
            type="text"
            icon={<FiCreditCard />}
            value={carData.car_registration}
            onChange={(e) => updateCarData('car_registration', e.target.value.toUpperCase())}
            placeholder="ABC-1234"
            required
          />

          {/* ประเภทรถ */}
          <div>
            <label className="block text-sm font-bold mb-2">ประเภทรถ</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  className="w-full border-2 border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                  value={carData.car_type_id}
                  onChange={(e) => updateCarData('car_type_id', e.target.value)}
                  disabled={loadingCarTypes}
                  required
                >
                  <option value="">-- เลือกประเภทรถ --</option>
                  {carTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.carType_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => setShowAddCarType(true)}
                title="เพิ่มประเภทรถใหม่"
              >
                <FiPlus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ส่วนเพิ่มประเภทรถใหม่ */}
        {showAddCarType && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-semibold mb-3 text-blue-700">เพิ่มประเภทรถใหม่</h5>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border-2 border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                placeholder="ชื่อประเภทรถ เช่น รถตู้, รถบัส, รถกระบะ"
                value={newCarTypeName}
                onChange={(e) => setNewCarTypeName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCarType();
                  }
                }}
              />
              <button
                type="button"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                onClick={handleAddCarType}
                disabled={addingCarType || !newCarTypeName.trim()}
              >
                {addingCarType ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setShowAddCarType(false);
                  setNewCarTypeName('');
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* สรุปข้อมูลรถ */}
        {carData.car_name && carData.car_registration && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="font-semibold mb-2 text-gray-700">สรุปข้อมูลรถ</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>รถ:</strong> {carData.car_name}</p>
              <p><strong>ทะเบียน:</strong> {carData.car_registration}</p>
              <p><strong>ความจุ:</strong> {carData.car_capacity} ที่นั่ง</p>
              {carData.car_type_id && (
                <p><strong>ประเภท:</strong> {carTypes.find(t => t._id === carData.car_type_id)?.carType_name || 'ไม่ระบุ'}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DriverForm;