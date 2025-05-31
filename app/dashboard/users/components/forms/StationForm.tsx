// app/dashboard/users/components/forms/StationForm.tsx - Corrected
import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiHome } from 'react-icons/fi';
import { FormField, PasswordField, usePasswordReset } from './shared';
import { User } from '../../types';

interface StationFormProps {
  user: Partial<User>;
  updateUser: (field: string, value: string | number) => void;
  isEditing?: boolean;
}

const StationForm: React.FC<StationFormProps> = ({ user, updateUser, isEditing = false }) => {
  const { showTempPassword, tempPassword, loading, handleReset } = usePasswordReset(user._id, updateUser);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-lg mb-4 text-green-600 border-b border-green-200 pb-2">
          ຂໍ້ມູນສະຖານີ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField 
            label="ຊື່ສະຖານີ" 
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
          
          <PasswordField 
            value={user.password || ''} 
            onChange={(value) => updateUser('password', value)}
            isEditing={isEditing}
            onReset={handleReset}
            loading={loading}
            showTempPassword={showTempPassword}
            tempPassword={tempPassword}
          />
          
          <div className="md:col-span-2">
            <FormField 
              label="ສະຖານທີ່ຕັ້ງ" 
              icon={<FiMapPin />} 
              placeholder="ບ້ານ ນາໄຊ, ເມືອງ ຫຼວງພະບາງ" 
              value={user.location || ''} 
              onChange={(e) => updateUser('location', e.target.value)} 
              required 
            />
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-bold">ໝາຍເຫດ:</span> ສະຖານີຈະສາມາດເຂົ້າເບິ່ງຂໍ້ມູນແລະລາຍໄດ້ສະເພາະຂອງສະຖານີເທົ່ານັ້ນ.
        </p>
      </div>
    </div>
  );
};

export default StationForm;