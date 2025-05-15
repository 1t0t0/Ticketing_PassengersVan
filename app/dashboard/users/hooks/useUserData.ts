// app/dashboard/users/hooks/useUserData.ts
import { useState, useCallback } from 'react';
import { fetchAllUsers } from '../api/user';
import { User, ApiError } from '../types';
import notificationService from '@/lib/notificationService';

export default function useUserData() {
  // State สำหรับข้อมูลผู้ใช้
  const [drivers, setDrivers] = useState<User[]>([]);
  const [ticketSellers, setTicketSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [stations, setStations] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ฟังก์ชันดึงข้อมูลผู้ใช้ทั้งหมด
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ดึงข้อมูลผู้ใช้ทั้งหมด
      const userData = await fetchAllUsers();
      
      // แยกประเภทผู้ใช้
      const driverUsers = userData.filter((user: User) => user.role === 'driver');
      const staffUsers = userData.filter((user: User) => user.role === 'staff');
      const adminUsers = userData.filter((user: User) => user.role === 'admin');
      const stationUsers = userData.filter((user: User) => user.role === 'station');
      
      // อัปเดตสถานะ
      setDrivers(driverUsers);
      setTicketSellers(staffUsers);
      setAdmins(adminUsers);
      setStations(stationUsers);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນຜູ້ໃຊ້: ${errorMessage}`);
      
      // ตั้งค่า default values เพื่อให้ UI ยังทำงานได้
      setDrivers([]);
      setTicketSellers([]);
      setAdmins([]);
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    drivers,
    ticketSellers,
    admins,
    stations,
    loading,
    error,
    fetchUsers
  };
}