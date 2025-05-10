import React from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface StationListProps {
  stations: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
}

const StationList: React.FC<StationListProps> = ({ stations, showConfirmation }) => {
  const [loading, setLoading] = React.useState(false);
  
  // ฟังก์ชันลบสถานี
  const handleDeleteStation = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສະຖານີ ${name}?`, async () => {
      try {
        setLoading(true);
        
        // ลบผู้ใช้
        await deleteUser(userId);
        
        // ดึงข้อมูลใหม่ (ตรงนี้จะเป็นการรีเฟรชด้วย props onRefresh จาก UserCard)
        notificationService.success('ລຶບສະຖານີສຳເລັດແລ້ວ');
      } catch (error: any) {
        console.error('Error deleting station:', error);
        notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການລຶບສະຖານີ: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  // Handle refresh after action
  const handleRefresh = () => {
    // ตรงนี้จะแทนที่ด้วยการเรียก fetchUsers ผ่าน props ในการใช้งานจริง 
    // แต่ตอนนี้เป็นตัวอย่างโดยไม่มีการเรียก API จริง
    console.log('Refreshing station list...');
  };
  
  // แสดงแถบโหลดหรือข้อความว่าไม่มีข้อมูลถ้าจำเป็น
  if (loading) {
    return (
      <div className="text-center py-8">
        <p>ກຳລັງໂຫລດ...</p>
      </div>
    );
  }
  
  if (stations.length === 0) {
    return (
      <div className="text-center py-8">
        <p>ບໍ່ມີຂໍ້ມູນສະຖານີ</p>
      </div>
    );
  }
  
  return (
    <div>
      {stations.map((station) => (
        <UserCard 
          key={station._id}
          user={station}
          onDelete={handleDeleteStation}
          onRefresh={handleRefresh}
        />
      ))}
    </div>
  );
};

export default StationList;