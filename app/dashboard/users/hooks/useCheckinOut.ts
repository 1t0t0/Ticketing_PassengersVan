// app/dashboard/users/hooks/useCheckinOut.ts - Updated with WorkLog integration
import { useState, useCallback } from 'react';
import { checkInOutUser } from '../api/user';
import notificationService from '@/lib/notificationService';

export default function useCheckInOut(onSuccess: () => void) {
  // สถานะการโหลดสำหรับแต่ละผู้ใช้
  const [checkingInOut, setCheckingInOut] = useState<{[key: string]: boolean}>({});
  
  // ฟังก์ชันบันทึก WorkLog
  const logWorkAction = async (userId: string, action: 'check-in' | 'check-out') => {
    try {
      const response = await fetch(`/api/work-logs/user/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        console.error('Failed to log work action');
        // ไม่ throw error เพราะไม่ต้องการให้การบันทึก WorkLog ที่ล้มเหลวไปกระทบกับ check-in/out
      } else {
        console.log(`WorkLog recorded: ${action} for user ${userId}`);
      }
    } catch (error) {
      console.error('Error logging work action:', error);
      // ไม่ throw error เพราะไม่ต้องการให้การบันทึก WorkLog ที่ล้มเหลวไปกระทบกับ check-in/out
    }
  };
  
  // ฟังก์ชันสำหรับการเช็คอิน/เช็คเอาท์
  const handleCheckInOut = useCallback(async (userId: string, currentStatus: string) => {
    try {
      // อัพเดตสถานะการโหลดของผู้ใช้นี้
      setCheckingInOut(prev => ({ ...prev, [userId]: true }));
      
      // คำนวณสถานะใหม่
      const newStatus = currentStatus === 'checked-in' ? 'checked-out' : 'checked-in';
      const action = newStatus === 'checked-in' ? 'check-in' : 'check-out';
      
      // เรียก API อัพเดต check-in status ก่อน
      await checkInOutUser(userId, newStatus);
      
      // บันทึก WorkLog หลังจากที่ check-in/out สำเร็จแล้ว
      await logWorkAction(userId, action);
      
      // รีโหลดข้อมูล
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      
      // แสดง Notification
      notificationService.success(`${action === 'check-in' ? 'ເຊັກອິນ' : 'ເຊັກເອົາ'} ສຳເລັດແລ້ວ`);
      
    } catch (error: any) {
      console.error('Error updating check in status:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
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