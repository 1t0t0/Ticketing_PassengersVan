import { useState, useCallback } from 'react';
import { checkInOutUser } from '../api/user';
import notificationService from '@/lib/notificationService';

export default function useCheckInOut(onSuccess: () => void) {
  // สถานะการโหลดของแต่ละผู้ใช้
  const [checkingInOut, setCheckingInOut] = useState<{[key: string]: boolean}>({});
  
  // ฟังก์ชันสำหรับการเช็คอิน/เช็คเอาท์
  const handleCheckInOut = useCallback(async (userId: string, currentStatus: string) => {
    try {
      // อัปเดตสถานะการโหลดของผู้ใช้นี้
      setCheckingInOut(prev => ({ ...prev, [userId]: true }));
      
      // คำนวณสถานะใหม่
      const newStatus = currentStatus === 'checked-in' ? 'checked-out' : 'checked-in';
      
      // เรียก API
      await checkInOutUser(userId, newStatus);
      
      // รีโหลดข้อมูลหลังจากสำเร็จ
      onSuccess();
      
      // แสดง Notification
      notificationService.success(`${newStatus === 'checked-in' ? 'ເຊັກອິນ' : 'ເຊັກເອົາ'} ສຳເລັດແລ້ວ`);
      
    } catch (error: any) {
      console.error('Error updating check in status:', error);
      notificationService.error(`Error: ${error.message}`);
    } finally {
      // รีเซ็ตสถานะการโหลดของผู้ใช้นี้
      setCheckingInOut(prev => ({ ...prev, [userId]: false }));
    }
  }, [onSuccess]);
  
  return {
    checkingInOut,
    handleCheckInOut
  };
}