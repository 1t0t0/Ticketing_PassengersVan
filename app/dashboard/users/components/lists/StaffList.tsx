import React from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface StaffListProps {
  staff: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
}

const StaffList: React.FC<StaffListProps> = ({ staff, showConfirmation }) => {
  const [loading, setLoading] = React.useState(false);
  
  // ฟังก์ชันลบพนักงานขายตั๋ว
  const handleDeleteStaff = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ ${name}?`, async () => {
      try {
        setLoading(true);
        
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
    console.log('Refreshing staff list...');
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
          onRefresh={handleRefresh}
        />
      ))}
    </div>
  );
};

export default StaffList;