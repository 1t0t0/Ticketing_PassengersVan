// app/dashboard/users/hooks/useUserPermissions.ts - Updated to allow Staff manage Drivers
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
  
  // ตรวจสอบสิทธิ์ในการแก้ไขผู้ใช้ - อนุญาตให้ Staff แก้ไข Driver ได้
  const canEditUser = useCallback((user: User) => {
    // Admin สามารถแก้ไขทุกคนได้
    if (isAdmin()) return true;
    
    // Staff สามารถแก้ไข Driver ได้ แต่ไม่สามารถแก้ไข Staff/Admin/Station อื่นได้
    if (isStaff() && user.role === 'driver') return true;
    
    // Staff สามารถแก้ไขตัวเองได้
    if (isStaff() && user.role === 'staff' && user._id === session?.user?.id) return true;
    
    return false;
  }, [isAdmin, isStaff, session?.user?.id]);
  
  // ตรวจสอบสิทธิ์ในการลบผู้ใช้ - อนุญาตให้ Staff ลบ Driver ได้
  const canDeleteUser = useCallback((user: User) => {
    // Admin สามารถลบทุกคนได้
    if (isAdmin()) return true;
    
    // Staff สามารถลบ Driver ได้
    if (isStaff() && user.role === 'driver') return true;
    
    return false;
  }, [isAdmin, isStaff]);
  
  // ตรวจสอบสิทธิ์ในการเพิ่มผู้ใช้ - อนุญาตให้ Staff เพิ่ม Driver ได้
  const canAddUser = useCallback((userType?: string) => {
    // Admin สามารถเพิ่มทุกประเภทได้
    if (isAdmin()) return true;
    
    // Staff สามารถเพิ่ม Driver ได้เท่านั้น
    if (isStaff() && (!userType || userType === 'driver')) return true;
    
    return false;
  }, [isAdmin, isStaff]);
  
  // ตรวจสอบว่าควรแสดงแท็บหรือไม่
  const shouldShowTab = useCallback((tab: 'drivers' | 'staff' | 'admin' | 'station') => {
    if (isAdmin()) {
      return true; // Admin เห็นทุกแท็บ
    }
    
    if (isStaff()) {
      // Staff เห็นเฉพาะแท็บ drivers
      return ['drivers'].includes(tab);
    }
    
    return false;
  }, [isAdmin, isStaff]);
  
  // ตรวจสอบสิทธิ์ในการรีเซ็ตรหัสผ่าน - อนุญาตให้ Staff รีเซ็ตรหัสผ่าน Driver ได้
  const canResetPassword = useCallback((user: User) => {
    // Admin สามารถรีเซ็ตรหัสผ่านทุกคนได้
    if (isAdmin()) return true;
    
    // Staff สามารถรีเซ็ตรหัสผ่าน Driver ได้
    if (isStaff() && user.role === 'driver') return true;
    
    return false;
  }, [isAdmin, isStaff]);
  
  return {
    isAdmin,
    isStaff,
    canShowCheckInOutButton,
    canEditUser,
    canDeleteUser,
    canAddUser,
    canResetPassword,
    shouldShowTab
  };
}