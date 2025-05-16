// app/dashboard/users/components/forms/StationForm.tsx
import React, { useState } from 'react';
import { 

  FiMail, 
  FiPhone, 
  FiMapPin,
  FiHome,
  FiRefreshCw
} from 'react-icons/fi';

import FormField from './FormField';
import { User } from '../../types';
import { resetUserPassword } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface StationFormProps {
  user: Partial<User>;
  updateUser: (field: string, value: string | number) => void;
  isEditing?: boolean;
}

const StationForm: React.FC<StationFormProps> = ({
  user,
  updateUser,
  isEditing = false
}) => {
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  // ฟังก์ชั่นรีเซ็ตรหัสผ่าน
  const handleResetPassword = async () => {
    if (!user._id) return;
    
    try {
      setResetPasswordLoading(true);
      
      const response = await resetUserPassword(user._id);
      setTempPassword(response.temporaryPassword);
      setShowTempPassword(true);
      updateUser('password', response.temporaryPassword);
      
      notificationService.success('ລະຫັດຜ່ານໄດ້ຖືກລີເຊັດແລ້ວ');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-lg mb-4">ຂໍ້ມູນສະຖານີ</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          label="ຊື່ສະຖານີ"
          type="text"
          icon={<FiHome />}
          value={user.name || ''}
          onChange={(e) => updateUser('name', e.target.value)}
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
        
        {/* รหัสผ่าน */}
        <div>
          <label className="block text-sm font-bold mb-2">ລະຫັດຜ່ານ</label>
          <div className="relative">
            <input
              type="text"
              className="w-full border-2 border-gray-300 rounded p-2 pr-10"
              value={user.password || ''}
              onChange={(e) => updateUser('password', e.target.value)}
              placeholder={isEditing ? "ໃສ່ລະຫັດຜ່ານໃໝ່ຫຼືປະໄວ້ຄືເກົ່າ" : "ລະຫັດຜ່ານ"}
            />
            {isEditing && (
              <button
                type="button"
                className="absolute right-2 top-2 text-blue-500 hover:text-blue-700"
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
        
        <div className="md:col-span-2">
          <FormField 
            label="ສະຖານທີ່ຕັ້ງ"
            type="text"
            icon={<FiMapPin />}
            placeholder="ບ້ານ ນາໄຊ, ເມືອງ ຫຼວງພະບາງ"
            value={user.location || ''}
            onChange={(e) => updateUser('location', e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-bold">ໝາຍເຫດ:</span> ສະຖານີຈະສາມາດເຂົ້າເບິ່ງຂໍ້ມູນແລະລາຍໄດ້ສະເພາະຂອງສະຖານີເທົ່ານັ້ນ.
        </p>
      </div>
    </div>
  );
};

export default StationForm;