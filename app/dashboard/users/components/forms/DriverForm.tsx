import React from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiCreditCard,
  FiCamera,
  FiTruck 
} from 'react-icons/fi';

import FormField from './FormField';
import { CAR_TYPES } from '../../config/constants';
import { User, Car } from '../../types';

interface DriverFormProps {
  user: Partial<User>;
  car: Partial<Car>;
  updateUser: (field: string, value: string | number) => void;
  updateCar: (field: string, value: string | number) => void;
  idCardImageFile: File | null;
  userImageFile: File | null;
  setIdCardImageFile: (file: File | null) => void;
  setUserImageFile: (file: File | null) => void;
  uploadProgress: number;
}

const DriverForm: React.FC<DriverFormProps> = ({
  user,
  car,
  updateUser,
  updateCar,
  idCardImageFile,
  userImageFile,
  setIdCardImageFile,
  setUserImageFile,
  uploadProgress
}) => {
  // ฟังก์ชันสำหรับจัดการการเลือกไฟล์
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'idCard') {
        setIdCardImageFile(e.target.files[0]);
      } else {
        setUserImageFile(e.target.files[0]);
      }
    }
  };

  return (
    <>
      {/* ข้อมูลทั่วไป */}
      <div className="mb-6">
        <h4 className="font-semibold text-lg mb-4">ຂໍ້ມູນທົ່ວໄປ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="ຊື່ ແລະ ນາມສະກຸນ"
            type="text"
            icon={<FiUser />}
            value={user.name || ''}
            onChange={(e) => updateUser('name', e.target.value)}
            required
          />
          
          <FormField 
            label="ວັນເດືອນປີເກີດ"
            type="date"
            icon={<FiCalendar />}
            value={user.birthDate || ''}
            onChange={(e) => updateUser('birthDate', e.target.value)}
            required
          />
          
          <FormField 
            label="ອີເມວ"
            type="email"
            icon={<FiMail />}
            value={user.email || ''}
            onChange={(e) => updateUser('email', e.target.value)}
            required
          />
          
          <FormField 
            label="ເບີໂທລະສັບ"
            type="tel"
            icon={<FiPhone />}
            placeholder="12345678"
            value={user.phone || ''}
            onChange={(e) => updateUser('phone', e.target.value)}
          />
          
          <FormField 
            label="ລະຫັດຜ່ານ"
            type="password"
            value={user.password || ''}
            onChange={(e) => updateUser('password', e.target.value)}
            required
          />

          <FormField 
            label="ເລກບັດປະຈຳຕົວ"
            type="text"
            icon={<FiCreditCard />}
            value={user.idCardNumber || ''}
            onChange={(e) => updateUser('idCardNumber', e.target.value)}
            required
          />
        </div>
      </div>
      
      {/* รูปภาพ */}
      <div className="mb-6 border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-lg mb-4">ຮູບພາບ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">ຮູບບັດປະຈຳຕົວ</label>
            <div className="flex items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="idCardImage"
                onChange={(e) => handleFileChange(e, 'idCard')}
              />
              <label
                htmlFor="idCardImage"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
              >
                {idCardImageFile ? (
                  <div className="text-center">
                    <FiCamera className="mx-auto text-2xl text-green-500" />
                    <p className="text-sm mt-1">{idCardImageFile.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FiCamera className="mx-auto text-2xl text-gray-400" />
                    <p className="text-sm mt-1">ອັບໂຫລດຮູບບັດປະຈຳຕົວ</p>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">ຮູບຖ່າຍ</label>
            <div className="flex items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="userImage"
                onChange={(e) => handleFileChange(e, 'user')}
              />
              <label
                htmlFor="userImage"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
              >
                {userImageFile ? (
                  <div className="text-center">
                    <FiCamera className="mx-auto text-2xl text-green-500" />
                    <p className="text-sm mt-1">{userImageFile.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FiCamera className="mx-auto text-2xl text-gray-400" />
                    <p className="text-sm mt-1">ອັບໂຫລດຮູບຖ່າຍ</p>
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
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">ອັບໂຫລດ: {uploadProgress}%</p>
          </div>
        )}
      </div>
      
      {/* ข้อมูลรถ */}
      <div className="mb-6 border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-lg mb-4">ຂໍ້ມູນລົດ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="ຊື່ລົດ"
            type="text"
            icon={<FiTruck />}
            placeholder="Toyota Hiace"
            value={car.car_name || ''}
            onChange={(e) => updateCar('car_name', e.target.value)}
            required
          />
          
          <FormField 
            label="ທະບຽນລົດ"
            type="text"
            placeholder="12ກຂ 3456"
            value={car.car_registration || ''}
            onChange={(e) => updateCar('car_registration', e.target.value)}
            required
          />
          
          <FormField 
            label="ຄວາມຈຸຜູ້ໂດຍສານ"
            type="number"
            value={car.car_capacity?.toString() || '10'}
            onChange={(e) => updateCar('car_capacity', parseInt(e.target.value) || 10)}
            required
            min="1"
          />

          <div>
            <label className="block text-sm font-bold mb-2">ປະເພດລົດ</label>
            <select 
              className="w-full border-2 border-gray-300 rounded p-2"
              value={car.car_type || 'van'}
              onChange={(e) => updateCar('car_type', e.target.value)}
              required
            >
              {CAR_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default DriverForm;