import React from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface AdminListProps {
  admins: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
}

const AdminList: React.FC<AdminListProps> = ({ admins, showConfirmation }) => {
  const [loading, setLoading] = React.useState(false);
  
  // ฟังก์ชันลบแอดมิน
  const handleDeleteAdmin = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ ${name}?`, async () => {
      try {
        setLoading(true);
        
        // ตรวจสอบว่าเป็น admin คนสุดท้ายหรือไม่
        if (admins.length <= 1) {
          notificationService.error('ບໍ່ສາມາດລຶບແອດມິນຄົນສຸດທ້າຍໄດ້');
          return;
        }
        
        // ลบผู้ใช้
        await deleteUser(userId);
        
        // ดึงข้อมูลใหม่ (ตรงนี้จะเป็นการรีเฟรชด้วย props onRefresh จาก UserCard)
        notificationService.success('ລຶບຜູ້ໃຊ້ສຳເລັດແລ້ວ');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການລຶບຜູ້ໃຊ້: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  // Handle refresh after check-in/out
  const handleRefresh = () => {
    // ตรงนี้จะแทนที่ด้วยการเรียก fetchUsers ผ่าน props ในการใช้งานจริง 
    // แต่ตอนนี้เป็นตัวอย่างโดยไม่มีการเรียก API จริง
    console.log('Refreshing admin list...');
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
          onRefresh={handleRefresh}
        />
      ))}
    </div>
  );
};

export default AdminList;