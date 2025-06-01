// app/dashboard/users/components/lists/AdminList.tsx - Low Quality Version
import React, { useState } from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';

interface AdminListProps {
  admins: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const AdminList: React.FC<AdminListProps> = ({ admins, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDeleteAdmin = async (userId: string, role: string, name: string) => {
    showConfirmation(`Delete ${name}?`, async () => {
      try {
        setLoading(true);
        if (admins.length <= 1) {
          alert('Cannot delete last admin');
          setLoading(false);
          return;
        }
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
  if (admins.length === 0) return <div>No admins found</div>;
  
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
        {admins.map((admin) => (
          <UserCard 
            key={admin._id}
            user={admin}
            admins={admins}
            onDelete={handleDeleteAdmin}
            onRefresh={onRefresh}
          />
        ))}
      </tbody>
    </table>
  );
};

export default AdminList;