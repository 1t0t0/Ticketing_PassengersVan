import React, { useState } from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface AdminListProps {
  admins: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const AdminList: React.FC<AdminListProps> = ({ admins, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  // ฟังก์ชันลบแอดมิน
  const handleDeleteAdmin = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ ${name}?`, async () => {
      try {
        setLoading(true);
        
        // ตรวจสอบว่าเป็น admin คนสุดท้ายหรือไม่
        if (admins.length <= 1) {
          notificationService.error('ບໍ່ສາມາດລຶບແອດມິນຄົນສຸດທ້າຍໄດ້');
          setLoading(false);
          return;
        }
        
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
  
  if (admins.length === 0) {
    return (
      <div className="text-center py-8">
        <p>ບໍ່ມີຂໍ້ມູນຜູ້ບໍລິຫານລະບົບ</p>
      </div>
    );
  }
  
  return (
    <div>
      {admins.map((admin) => (
        <UserCard 
          key={admin._id}
          user={admin}
          admins={admins}
          onDelete={handleDeleteAdmin}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default AdminList;