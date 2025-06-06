// app/dashboard/users/components/forms/StaffForm.tsx - Updated with handleRemoveImage
import React from 'react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiCreditCard, FiCamera } from 'react-icons/fi';
import { FormField, PasswordField, usePasswordReset } from './shared';
import { User } from '../../types';

interface StaffFormProps {
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

const StaffForm: React.FC<StaffFormProps> = ({
  user, updateUser, idCardImageFile, userImageFile, setIdCardImageFile, setUserImageFile,
  uploadProgress, idCardImagePreview, userImagePreview, isEditing = false, 
  handleFileChange, handleRemoveImage
}) => {
  const { showTempPassword, tempPassword, loading, handleReset } = usePasswordReset(user._id, updateUser);
  
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
          <PasswordField value={user.password || ''} onChange={(value) => updateUser('password', value)}
                         isEditing={isEditing} onReset={handleReset} loading={loading}
                         showTempPassword={showTempPassword} tempPassword={tempPassword} />
          <FormField label="ເລກບັດປະຈຳຕົວ" icon={<FiCreditCard />} value={user.idCardNumber || ''} 
                     onChange={(e) => updateUser('idCardNumber', e.target.value)} required />
        </div>
      </div>
      
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
    </div>
  );
};

export default StaffForm;