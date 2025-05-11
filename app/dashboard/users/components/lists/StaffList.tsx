import React, { useState } from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface StaffListProps {
  staff: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const StaffList: React.FC<StaffListProps> = ({ staff, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  // ฟังก์ชันลบพนักงานขายตั๋ว
  const handleDeleteStaff = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ ${name}?`, async () => {
      try {
        setLoading(true);
        
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
  
  if (staff.length === 0) {
    return (
      <div className="text-center py-8">
        <p>ບໍ່ມີຂໍ້ມູນພະນັກງານຂາຍປີ້</p>
      </div>
    );
  }
  
  return (
    <div>
      {staff.map((staffMember) => (
        <UserCard 
          key={staffMember._id}
          user={staffMember}
          onDelete={handleDeleteStaff}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default StaffList;