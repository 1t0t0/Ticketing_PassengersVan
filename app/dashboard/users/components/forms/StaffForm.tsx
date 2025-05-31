// app/dashboard/users/components/forms/StaffForm.tsx - Corrected
import React from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiCreditCard,
  FiCamera
} from 'react-icons/fi';

import { FormField, PasswordField, ImageUpload, usePasswordReset } from './shared';
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
}

const StaffForm: React.FC<StaffFormProps> = ({
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
  handleFileChange
}) => {
  const { showTempPassword, tempPassword, loading, handleReset } = usePasswordReset(user._id, updateUser);
  
  const defaultHandleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      type === 'idCard' ? setIdCardImageFile(file) : setUserImageFile(file);
    }
  };
  
  const fileChangeHandler = handleFileChange || defaultHandleFileChange;

  return (
    <div className="space-y-6">
      {/* ข้อมูลทั่วไป */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiUser className="inline mr-2" />
          ຂໍ້ມູນທົ່ວໄປ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="ຊື່ ແລະ ນາມສະກຸນ"
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
          
          <PasswordField 
            value={user.password || ''} 
            onChange={(value) => updateUser('password', value)}
            isEditing={isEditing}
            onReset={handleReset}
            loading={loading}
            showTempPassword={showTempPassword}
            tempPassword={tempPassword}
          />

          <FormField 
            label="ເລກບັດປະຈຳຕົວ"
            icon={<FiCreditCard />}
            value={user.idCardNumber || ''}
            onChange={(e) => updateUser('idCardNumber', e.target.value)}
            required
          />
        </div>
      </div>
      
      {/* รูปภาพ */}
      <div>
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          <FiCamera className="inline mr-2" />
          ຮູບພາບ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUpload 
            label="ຮູບບັດປະຈຳຕົວ"
            file={idCardImageFile}
            preview={idCardImagePreview}
            onFileChange={(e) => fileChangeHandler(e, 'idCard')}
            onRemove={() => setIdCardImageFile(null)}
            id="idCardImage"
          />
          
          <ImageUpload 
            label="ຮູບຖ່າຍ"
            file={userImageFile}
            preview={userImagePreview}
            onFileChange={(e) => fileChangeHandler(e, 'user')}
            onRemove={() => setUserImageFile(null)}
            id="userImage"
          />
        </div>
        
        {/* Upload progress bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">ກຳລັງອັບໂຫລດ: {uploadProgress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffForm;