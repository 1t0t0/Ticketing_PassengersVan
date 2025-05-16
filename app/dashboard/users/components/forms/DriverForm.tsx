// app/dashboard/users/components/forms/DriverForm.tsx
import React from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiCreditCard,
  FiCamera,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';

import FormField from './FormField';
import { User } from '../../types';
import { resetUserPassword } from '../../api/user';
import notificationService from '@/lib/notificationService';

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
  handleFileChange
}) => {
  const [showTempPassword, setShowTempPassword] = React.useState(false);
  const [tempPassword, setTempPassword] = React.useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = React.useState(false);
  

  const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    
    // ตรวจสอบรูปแบบของ dateStr
    // หากเป็นรูปแบบ ISO (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.substring(0, 10); // ตัดเฉพาะส่วน YYYY-MM-DD
    }
    
    // หากเป็นรูปแบบ dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // แปลงเป็น YYYY-MM-DD
    }
    
    // กรณีอื่นๆ ให้ลองแปลงเป็น Date object แล้วแปลงกลับเป็น string
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().substring(0, 10);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
    
    return ''; // กรณีไม่สามารถแปลงได้
  };


  // ฟังก์ชั่นรีเซ็ตรหัสผ่าน
  const handleResetPassword = async () => {
    if (!user._id) return;
    
    try {
      setResetPasswordLoading(true);
      
      const response = await resetUserPassword(user._id);
      setTempPassword(response.temporaryPassword);
      setShowTempPassword(true);
      updateUser('password', response.temporaryPassword);
      
      notificationService.success('ລະຫັດຜ່ານຖືກລີເຊັດແລ້ວ');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
    } finally {
      setResetPasswordLoading(false);
    }
  };
  
  // ฟังก์ชันจัดการการเลือกไฟล์ถ้าไม่ได้รับมาจากพร็อพ
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
  
  // ใช้ handleFileChange ที่ส่งมาหรือใช้ค่าดีฟอลต์
  const fileChangeHandler = handleFileChange || defaultHandleFileChange;

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
  value={formatDateForInput(user.birthDate)}
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
          
          {/* รหัสผ่าน */}
          <div>
            <label className="block text-sm font-bold mb-2">ລະຫັດຜ່ານ</label>
            <div className="relative">
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded p-2 pr-10"
                value={user.password || ''}
                onChange={(e) => updateUser('password', e.target.value)}
                placeholder={isEditing ? "ใส่รหัสผ่านใหม่หรือปล่อยว่างไว้เพื่อใช้รหัสผ่านเดิม" : "รหัสผ่าน"}
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
         {/* รูปบัตรประจำตัว */}
         <div>
           <label className="block text-sm font-bold mb-2">ຮູບບັດປະຈຳຕົວ</label>
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
               className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
             >
               {idCardImageFile || idCardImagePreview ? (
                 <div className="text-center relative w-full h-full">
                   {/* แสดงรูปพรีวิว */}
                   <img 
                     src={idCardImageFile 
                       ? URL.createObjectURL(idCardImageFile) 
                       : idCardImagePreview || ''}
                     alt="ID Card Preview" 
                     className="w-full h-full object-contain p-2"
                   />
                   <button 
                     type="button"
                     className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
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
                   <FiCamera className="mx-auto text-2xl text-gray-400" />
                   <p className="text-sm mt-1">ອັບໂຫລດຮູບບັດປະຈຳຕົວ</p>
                 </div>
               )}
             </label>
           </div>
         </div>
         
         {/* รูปถ่าย */}
         <div>
           <label className="block text-sm font-bold mb-2">ຮູບຖ່າຍ</label>
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
               className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
             >
               {userImageFile || userImagePreview ? (
                 <div className="text-center relative w-full h-full">
                   {/* แสดงรูปพรีวิว */}
                   <img 
                     src={userImageFile 
                       ? URL.createObjectURL(userImageFile) 
                       : userImagePreview || ''}
                     alt="User Photo Preview" 
                     className="w-full h-full object-contain p-2"
                   />
                   <button 
                     type="button"
                     className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
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
   </>
 );
};

export default DriverForm;