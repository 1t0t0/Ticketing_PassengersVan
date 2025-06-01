// app/dashboard/users/components/lists/StationList.tsx - Low Quality Version
import React, { useState } from 'react';
import UserCard from '../UserCard';
import { User } from '../../types';
import { deleteUser } from '../../api/user';

interface StationListProps {
  stations: User[];
  showConfirmation: (message: string, onConfirm: () => void) => void;
  onRefresh: () => void;
}

const StationList: React.FC<StationListProps> = ({ stations, showConfirmation, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDeleteStation = async (userId: string, role: string, name: string) => {
    showConfirmation(`Delete station ${name}?`, async () => {
      try {
        setLoading(true);
        await deleteUser(userId);
        onRefresh();
        alert('Station deleted successfully');
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  if (loading) return <div>Loading...</div>;
  if (stations.length === 0) return <div>No stations found</div>;
  
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
        {stations.map((station) => (
          <UserCard 
            key={station._id}
            user={station}
            onDelete={handleDeleteStation}
            onRefresh={onRefresh}
          />
        ))}
      </tbody>
    </table>
  );
};

export default StationList;