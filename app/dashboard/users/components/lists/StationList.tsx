import React, { useState } from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';
import notificationService from '@/lib/notificationService';

interface StationListProps {
  stations: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const StationList: React.FC<StationListProps> = ({ stations, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  // ฟังก์ชันลบสถานี
  const handleDeleteStation = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບສະຖານີ ${name}?`, async () => {
      try {
        setLoading(true);
        
        // ลบผู้ใช้
        await deleteUser(userId);
        
        // เรียก onRefresh เพื่อโหลดข้อมูลใหม่
        onRefresh();
        
        // แสดงข้อความสำเร็จ
        notificationService.success('ລຶບສະຖານີສຳເລັດແລ້ວ');
      } catch (error: any) {
        console.error('Error deleting station:', error);
        notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການລຶບສະຖານີ: ${error.message}`);
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
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default StationList;