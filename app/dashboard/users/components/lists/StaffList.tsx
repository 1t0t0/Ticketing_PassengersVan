// app/dashboard/users/components/lists/StaffList.tsx - Low Quality Version
import React, { useState } from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';

interface StaffListProps {
  staff: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const StaffList: React.FC<StaffListProps> = ({ staff, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDeleteStaff = async (userId: string, role: string, name: string) => {
    showConfirmation(`Delete ${name}?`, async () => {
      try {
        setLoading(true);
        await deleteUser(userId);
        onRefresh();
        alert('User deleted successfully');
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  if (loading) return <div>Loading...</div>;
  if (staff.length === 0) return <div>No staff found</div>;
  
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 p-2 text-left">Name</th>
          <th className="border border-gray-300 p-2 text-left">Role</th>
          <th className="border border-gray-300 p-2 text-left">ID</th>
          <th className="border border-gray-300 p-2 text-left">Status</th>
          <th className="border border-gray-300 p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {staff.map((staffMember) => (
          <UserCard 
            key={staffMember._id}
            user={staffMember}
            onDelete={handleDeleteStaff}
            onRefresh={onRefresh}
          />
        ))}
      </tbody>
    </table>
  );
};

export default StaffList;