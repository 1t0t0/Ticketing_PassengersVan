// app/dashboard/users/hooks/useUserForm.ts
import { useState, useCallback } from 'react';
import { DEFAULT_USER } from '../config/constants';
import { User } from '../types';
import notificationService from '@/lib/notificationService';

export default function useUserForm(activeTab: 'drivers' | 'staff' | 'admin' | 'station') {
  // สถานะฟอร์ม
  const [user, setUser] = useState<Partial<User>>({
    ...DEFAULT_USER,
    role: activeTab === 'drivers' ? 'driver' :
          activeTab === 'staff' ? 'staff' :
          activeTab === 'admin' ? 'admin' : 'station'
  });
  
  // สถานะไฟล์รูปภาพ
  const [idCardImageFile, setIdCardImageFile] = useState<File | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  
  // ฟังก์ชันอัปเดตข้อมูลผู้ใช้
  const updateUser = useCallback((field: string, value: string | number) => {
    setUser(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // ฟังก์ชันรีเซ็ตฟอร์ม
  const resetForm = useCallback(() => {
    setUser({
      ...DEFAULT_USER,
      role: activeTab === 'drivers' ? 'driver' :
            activeTab === 'staff' ? 'staff' :
            activeTab === 'admin' ? 'admin' : 'station'
    });
    setIdCardImageFile(null);
    setUserImageFile(null);
  }, [activeTab]);
  
  // ฟังก์ชันตรวจสอบความถูกต้องของฟอร์ม
  const validateForm = useCallback(() => {
    // ตรวจสอบข้อมูลที่จำเป็นพื้นฐาน
    if (!user.name || !user.email || !user.password) {
      notificationService.error('ກະລຸນາກວດສອບຂໍ້ມູນທີ່ຈຳເປັນ');
      return false;
    }
    
    // ตรวจสอบข้อมูลเฉพาะตามประเภทผู้ใช้
    if (user.role === 'driver') {
      if (!user.idCardNumber) {
        notificationService.error('ກະລຸນາກວດສອບຂໍ້ມູນຄົນຂັບລົດທີ່ຈຳເປັນ');
        return false;
      }
    } else if (user.role === 'staff') {
      if (!user.idCardNumber) {
        notificationService.error('ກະລຸນາລະບຸເລກບັດປະຈຳຕົວ');
        return false;
      }
    } else if (user.role === 'station') {
      if (!user.location) {
        notificationService.error('ກະລຸນາລະບຸທີ່ຕັ້ງສະຖານີ');
        return false;
      }
    }
    
    return true;
  }, [user]);
  
  // อัปเดตประเภทผู้ใช้เมื่อ activeTab เปลี่ยน
  useCallback(() => {
    setUser(prev => ({
      ...prev,
      role: activeTab === 'drivers' ? 'driver' :
            activeTab === 'staff' ? 'staff' :
            activeTab === 'admin' ? 'admin' : 'station'
    }));
  }, [activeTab]);
  
  return {
    user,
    updateUser,
    idCardImageFile,
    userImageFile,
    setIdCardImageFile,
    setUserImageFile,
    resetForm,
    validateForm
  };
}