// app/dashboard/users/hooks/useUserData.ts
import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // ใช้ ref เพื่อเก็บสถานะว่าได้โหลดข้อมูลแล้วหรือไม่
  const isDataLoaded = useRef(false);
  
  // ฟังก์ชันดึงข้อมูลผู้ใช้ทั้งหมด
// app/dashboard/users/hooks/useUserData.ts
// แก้ไขฟังก์ชัน fetchUsers
const fetchUsers = useCallback(async () => {
  // ป้องกันการเรียกข้อมูลซ้ำในครั้งแรก
  if (isDataLoaded.current && !loading) {
    setLoading(true);
  }
  
  try {
    setError(null);
    
    // เพิ่ม console.log
    console.log('Fetching users...');
    
    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const userData = await fetchAllUsers();
    
    console.log('Fetched users count:', userData.length);
    console.log('First user has userImage?', userData[0] && userData[0].userImage ? 'Yes' : 'No');
    if (userData[0] && userData[0].userImage) {
      console.log('First user userImage snippet:', userData[0].userImage.substring(0, 30) + '...');
    }
    
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
    
    // อัปเดตสถานะว่าได้โหลดข้อมูลแล้ว
    isDataLoaded.current = true;
    
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
}, [loading]);
  
  // โหลดข้อมูลครั้งแรกเมื่อ component mount
  useEffect(() => {
    if (!isDataLoaded.current) {
      fetchUsers();
    }
  }, [fetchUsers]);
  
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