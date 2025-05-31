import React from 'react';
import { FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { FormField, PasswordField, usePasswordReset } from './shared';
import { User } from '../../types';

interface AdminFormProps {
  user: Partial<User>;
  updateUser: (field: string, value: string | number) => void;
  isEditing?: boolean;
}

const AdminForm: React.FC<AdminFormProps> = ({ user, updateUser, isEditing = false }) => {
  const { showTempPassword, tempPassword, loading, handleReset } = usePasswordReset(user._id, updateUser);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-lg mb-4 text-blue-600 border-b border-blue-200 pb-2">
          ຂໍ້ມູນຜູ້ບໍລິຫານລະບົບ
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
        </div>
      </div>
      
      <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md">
        <p className="text-sm text-yellow-700">
          <span className="font-bold">ໝາຍເຫດ:</span> ຜູ້ບໍລິຫານລະບົບມີສິດທິ່ໃນການຈັດການຜູ້ໃຊ້ລະບົບທັງໝົດ ລວມເຖິງການຕັ້ງຄ່າລະບົບຕ່າງໆ.
        </p>
      </div>
    </div>
  );
};

export default AdminForm;