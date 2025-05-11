import { useState, useCallback } from 'react';
import { fetchAllUsers, fetchCarsByUser } from '../api/user';
import { User, Driver, Car, ApiError } from '../types';
import notificationService from '@/lib/notificationService';

export default function useUserData() {
  // State สำหรับข้อมูลผู้ใช้
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ticketSellers, setTicketSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [stations, setStations] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ฟังก์ชันดึงข้อมูลผู้ใช้ทั้งหมด
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลผู้ใช้ทั้งหมด
      const userData = await fetchAllUsers();
      
      // แยกประเภทผู้ใช้
      const driverUsers = userData.filter((user: User) => user.role === 'driver');
      const staffUsers = userData.filter((user: User) => user.role === 'staff');
      const adminUsers = userData.filter((user: User) => user.role === 'admin');
      const stationUsers = userData.filter((user: User) => user.role === 'station');
      
      // ดึงข้อมูลรถที่เกี่ยวข้องกับคนขับ
      const driverIds = driverUsers.map(driver => driver._id);
      
      if (driverIds.length > 0) {
        try {
          const carsData = await fetchCarsByUser();
          
          // Map รถให้กับคนขับแต่ละคน
          const driversWithCars = driverUsers.map((driver: Driver) => {
            const assignedCar = carsData.find((car: Car) => car.user_id === driver._id);
            return { ...driver, assignedCar };
          });
          
          setDrivers(driversWithCars);
        } catch (carError) {
          console.error('Error fetching cars:', carError);
          // ถ้าดึงข้อมูลรถไม่ได้ ให้แสดงข้อมูลคนขับโดยไม่มีข้อมูลรถ
          setDrivers(driverUsers);
        }
      } else {
        setDrivers(driverUsers);
      }
      
      // อัปเดตสถานะ
      setTicketSellers(staffUsers);
      setAdmins(adminUsers);
      setStations(stationUsers);
      
      // แจ้งเตือนว่าโหลดข้อมูลสำเร็จ (เอาออกได้ถ้าไม่ต้องการให้แสดงบ่อย)
      // notificationService.success('ໂຫລດຂໍ້ມູນຜູ້ໃຊ້ລະບົບສຳເລັດແລ້ວ');
      
    } catch (error) {
      console.error('Error fetching users:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນຜູ້ໃຊ້: ${(error as ApiError).message || 'Unknown error'}`);
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
    fetchUsers
  };
}