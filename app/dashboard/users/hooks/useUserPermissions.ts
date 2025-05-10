import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { User } from '../types';

export default function useUserPermissions() {
  // Hook สำหรับจัดการสิทธิ์การใช้งาน
  const { data: session } = useSession();
  
  // ตรวจสอบว่าเป็น Admin หรือไม่
  const isAdmin = useCallback(() => {
    return session?.user?.role === 'admin';
  }, [session?.user?.role]);
  
  // ตรวจสอบว่าเป็น Staff หรือไม่
  const isStaff = useCallback(() => {
    return session?.user?.role === 'staff';
  }, [session?.user?.role]);
  
  // ตรวจสอบว่าสามารถแสดงปุ่ม Check In/Out หรือไม่
  const canShowCheckInOutButton = useCallback((user: User) => {
    if (!['driver', 'staff'].includes(user.role)) {
      return false;
    }
    
    if (isStaff() && user.role === 'staff' && user._id !== session?.user?.id) {
      return false;
    }
    
    return true;
  }, [isStaff, session?.user?.id]);
  
  // ตรวจสอบสิทธิ์ในการแก้ไขผู้ใช้
  const canEditUser = useCallback((user: User) => {
    return isAdmin();
  }, [isAdmin]);
  
  // ตรวจสอบสิทธิ์ในการลบผู้ใช้
  const canDeleteUser = useCallback((user: User) => {
    return isAdmin();
  }, [isAdmin]);
  
  // ตรวจสอบสิทธิ์ในการเพิ่มผู้ใช้
  const canAddUser = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);
  
  // ตรวจสอบว่าควรแสดงแท็บหรือไม่
  const shouldShowTab = useCallback((tab: 'drivers' | 'staff' | 'admin' | 'station') => {
    if (isAdmin()) {
      return true;
    }
    
    if (isStaff()) {
      return ['drivers'].includes(tab);
    }
    
    return false;
  }, [isAdmin, isStaff]);
  
  return {
    isAdmin,
    isStaff,
    canShowCheckInOutButton,
    canEditUser,
    canDeleteUser,
    canAddUser,
    shouldShowTab
  };
}