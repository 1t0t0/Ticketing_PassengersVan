import React from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
} from 'react-icons/fi';

import FormField from './FormField';
import { User } from '../../types';

interface AdminFormProps {
  user: Partial<User>;
  updateUser: (field: string, value: string | number) => void;
}

const AdminForm: React.FC<AdminFormProps> = ({
  user,
  updateUser
}) => {
  return (
    <div className="mb-6">
      <h4 className="font-semibold text-lg mb-4">ຂໍ້ມູນຜູ້ບໍລິຫານລະບົບ</h4>
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
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
        <p className="text-sm text-yellow-700">
          <span className="font-bold">ໝາຍເຫດ:</span> ຜູ້ບໍລິຫານລະບົບມີສິດທິ່ໃນການຈັດການຜູ້ໃຊ້ລະບົບທັງໝົດ ລວມເຖິງການຕັ້ງຄ່າລະບົບຕ່າງໆ.
        </p>
      </div>
    </div>
  );
};

export default AdminForm;