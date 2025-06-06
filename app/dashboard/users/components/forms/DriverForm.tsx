// app/dashboard/users/components/forms/DriverForm.tsx - Updated with handleRemoveImage
import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiCreditCard, FiCamera, FiTruck, FiPlus } from 'react-icons/fi';
import { FormField, PasswordField, usePasswordReset } from './shared';
import { User } from '../../types';
import notificationService from '@/lib/notificationService';

interface CarType { _id: string; carType_name: string; }
interface CarData { car_name: string; car_capacity: number; car_registration: string; car_type_id: string; }

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
  handleRemoveImage?: (type: 'idCard' | 'user') => void; // เพิ่ม prop นี้
  onCarDataChange?: (carData: CarData | null) => void;
  carData?: CarData | null;
}

// Enhanced ImageUpload component with remove functionality
const ImageUpload: React.FC<{
  label: string;
  file: File | null;
  preview?: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  id: string;
}> = ({ label, file, preview, onFileChange, onRemove, id }) => (
  <div>
    <label className="block text-sm font-bold mb-2">{label}</label>
    <input type="file" accept="image/*" className="hidden" id={id} onChange={onFileChange} />
    <label
      htmlFor={id}
      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
    >
      {file || preview ? (
        <div className="relative w-full h-full">
          <img 
            src={file ? URL.createObjectURL(file) : preview || ''}
            alt={`${label} Preview`} 
            className="w-full h-full object-contain p-2 rounded"
          />
          <button 
            type="button"
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onRemove(); 
            }}
            title="ລຶບຮູບ"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="text-center">
          <FiCamera className="mx-auto text-3xl text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      )}
    </label>
  </div>
);

const DriverForm: React.FC<DriverFormProps> = ({
  user, updateUser, idCardImageFile, userImageFile, setIdCardImageFile, setUserImageFile,
  uploadProgress, idCardImagePreview, userImagePreview, isEditing = false, 
  handleFileChange, handleRemoveImage, onCarDataChange, carData: initialCarData
}) => {
  const { showTempPassword, tempPassword, loading: resetLoading, handleReset } = usePasswordReset(user._id, updateUser);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [loadingCarTypes, setLoadingCarTypes] = useState(false);
  const [carData, setCarData] = useState<CarData>(initialCarData || { 
    car_name: '', car_capacity: 10, car_registration: '', car_type_id: '' 
  });

  // Fetch car types
  useEffect(() => {
    const fetchCarTypes = async () => {
      try {
        setLoadingCarTypes(true);
        const response = await fetch('/api/car-types');
        if (response.ok) setCarTypes(await response.json());
      } catch (error) {
        notificationService.error('ບໍ່ສາມາດໂຫລດປະເພດລົດໄດ້');
      } finally {
        setLoadingCarTypes(false);
      }
    };
    fetchCarTypes();
  }, []);

  useEffect(() => {
    if (initialCarData) setCarData(initialCarData);
  }, [initialCarData]);

  const updateCarData = (field: keyof CarData, value: string | number) => {
    const updated = { ...carData, [field]: value };
    setCarData(updated);
    onCarDataChange?.(updated);
  };

  const fileChangeHandler = handleFileChange || ((e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      type === 'idCard' ? setIdCardImageFile(file) : setUserImageFile(file);
    }
  });

  const removeImageHandler = handleRemoveImage || ((type: 'idCard' | 'user') => {
    type === 'idCard' ? setIdCardImageFile(null) : setUserImageFile(null);
  });

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiUser className="inline mr-2" />ຂໍ້ມູນທົ່ວໄປ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="ຊື່ ແລະ ນາມສະກຸນ" icon={<FiUser />} value={user.name || ''} 
                     onChange={(e) => updateUser('name', e.target.value)} required />
          <FormField label="ວັນເດືອນປີເກີດ" type="date" icon={<FiCalendar />} value={user.birthDate || ''} 
                     onChange={(e) => updateUser('birthDate', e.target.value)} required />
          <FormField label="ອີເມວ" type="email" icon={<FiMail />} value={user.email || ''} 
                     onChange={(e) => updateUser('email', e.target.value)} required />
          <FormField label="ເບີໂທລະສັບ" type="tel" icon={<FiPhone />} value={user.phone || ''} 
                     onChange={(e) => updateUser('phone', e.target.value)} />
          <FormField label="ເລກບັດປະຈຳຕົວ" icon={<FiCreditCard />} value={user.idCardNumber || ''} 
                     onChange={(e) => updateUser('idCardNumber', e.target.value)} required />
          <PasswordField value={user.password || ''} onChange={(value) => updateUser('password', value)}
                         isEditing={isEditing} onReset={handleReset} loading={resetLoading}
                         showTempPassword={showTempPassword} tempPassword={tempPassword} />
        </div>
      </div>
      
      {/* Images */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiCamera className="inline mr-2" />ຮູບພາບ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUpload 
            label="ຮູບບັດປະຈຳຕົວ" 
            file={idCardImageFile} 
            preview={idCardImagePreview}
            onFileChange={(e) => fileChangeHandler(e, 'idCard')} 
            onRemove={() => removeImageHandler('idCard')} 
            id="idCardImage" 
          />
          <ImageUpload 
            label="ຮູບຖ່າຍ" 
            file={userImageFile} 
            preview={userImagePreview}
            onFileChange={(e) => fileChangeHandler(e, 'user')} 
            onRemove={() => removeImageHandler('user')} 
            id="userImage" 
          />
        </div>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                   style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">ກຳລັງອັບໂຫລດ: {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Car Info */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-green-600 border-b border-green-200 pb-2">
          <FiTruck className="inline mr-2" />ຂໍ້ມູນລົດ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="ຊື່ລົດ / ຮຸ່ນລົດ" icon={<FiTruck />} value={carData.car_name} 
                     onChange={(e) => updateCarData('car_name', e.target.value)} required />
          <FormField label="ຄວາມຈຸລົດ (ຈຳນວນທີ່ນັ່ງ)" type="number" icon={<FiUser />} 
                     value={carData.car_capacity.toString()} min="1" required
                     onChange={(e) => updateCarData('car_capacity', parseInt(e.target.value) || 10)} />
          <FormField label="ໝາຍເລກທະບຽນລົດ" icon={<FiCreditCard />} value={carData.car_registration} 
                     onChange={(e) => updateCarData('car_registration', e.target.value.toUpperCase())} required />
          <div>
            <label className="block text-sm font-bold mb-2">ປະເພດລົດ</label>
            <select className="w-full border-2 border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                    value={carData.car_type_id} onChange={(e) => updateCarData('car_type_id', e.target.value)} 
                    disabled={loadingCarTypes} required>
              <option value="">{loadingCarTypes ? 'ກຳລັງໂຫລດ...' : '-- ເລືອກປະເພດລົດ --'}</option>
              {carTypes.map((type) => (
                <option key={type._id} value={type._id}>{type.carType_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverForm;