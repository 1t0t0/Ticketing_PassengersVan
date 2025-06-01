// app/dashboard/users/components/lists/DriverList.tsx - Low Quality Version (Lao)
import React, { useState } from 'react';
import UserCard from '../UserCard';
import { Driver, User } from '../../types';
import { deleteUser } from '../../api/user';

interface DriverListProps {
  drivers: Driver[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const DriverList: React.FC<DriverListProps> = ({ drivers, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDeleteDriver = async (userId: string, role: string, name: string) => {
    showConfirmation(`ລຶບ ${name} ບໍ?`, async () => {
      try {
        setLoading(true);
        await deleteUser(userId);
        onRefresh();
        alert('ລຶບຜູ້ໃຊ້ສຳເລັດແລ້ວ');
      } catch (error: any) {
        alert(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  if (loading) return <div>ກຳລັງໂຫລດ...</div>;
  if (drivers.length === 0) return <div>ບໍ່ພົບຄົນຂັບລົດ</div>;
  
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-2 text-left">ຊື່</th>
          <th className="border border-gray-300 p-2 text-left">ຕຳແໜ່ງ</th>
          <th className="border border-gray-300 p-2 text-left">ລະຫັດ</th>
          <th className="border border-gray-300 p-2 text-left">ສະຖານະ</th>
          <th className="border border-gray-300 p-2 text-left">ການດຳເນີນການ</th>
        </tr>
      </thead>
      <tbody>
        {drivers.map((driver) => (
          <UserCard 
            key={driver._id}
            user={driver}
            onDelete={handleDeleteDriver}
            onRefresh={onRefresh}
          />
        ))}
      </tbody>
    </table>
  );
};

export default DriverList;