import React, { useState } from 'react';
import UserCard from '../UserCard';
import { Driver, User } from '../../types';
import { deleteUser, deleteDriverCars } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface DriverListProps {
  drivers: Driver[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const DriverList: React.FC<DriverListProps> = ({ drivers, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  // ฟังก์ชันลบคนขับ
  const handleDeleteDriver = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ ${name}?`, async () => {
      try {
        setLoading(true);
        
        // ลบรถที่เกี่ยวข้องกับคนขับ
        await deleteDriverCars(userId);
        
        // ลบผู้ใช้
        await deleteUser(userId);
        
        // เรียก onRefresh เพื่อโหลดข้อมูลใหม่
        onRefresh();
        
        // แสดงข้อความสำเร็จ
        notificationService.success('ລຶບຜູ້ໃຊ້ສຳເລັດແລ້ວ');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການລຶບຜູ້ໃຊ້: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  // แสดงแถบโหลดหรือข้อความว่าไม่มีข้อมูลถ้าจำเป็น
  if (loading) {
    return (
      <div className="text-center py-8">
        <p>ກຳລັງໂຫລດ...</p>
      </div>
    );
  }
  
  if (drivers.length === 0) {
    return (
      <div className="text-center py-8">
        <p>ບໍ່ມີຂໍ້ມູນຄົນຂັບລົດ</p>
      </div>
    );
  }
  
  return (
    <div>
      {drivers.map((driver) => (
        <UserCard 
          key={driver._id}
          user={driver}
          onDelete={handleDeleteDriver}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default DriverList;