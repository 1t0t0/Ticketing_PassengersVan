'use client';

import NeoButton from '@/components/ui/NeoButton';
import NeoCard from '@/components/ui/NeoCard';
import { useState, useEffect } from 'react';




interface Driver {
  _id: string;
  name: string;
  employeeId: string;
  phone: string;
  email: string;
  status: string;
  checkInStatus: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      const data = await response.json();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', phone: '', email: '' });
        setShowModal(false);
        fetchDrivers();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create driver');
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (driverId: string) => {
    try {
      const response = await fetch(`/api/drivers/${driverId}/check-in`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchDrivers();
      }
    } catch (error) {
      console.error('Error checking in driver:', error);
    }
  };

  const handleCheckOut = async (driverId: string) => {
    try {
      const response = await fetch(`/api/drivers/${driverId}/check-out`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchDrivers();
      }
    } catch (error) {
      console.error('Error checking out driver:', error);
    }
  };

  // app/dashboard/drivers/page.tsx
// เพิ่มฟังก์ชันสำหรับเปลี่ยน status
const handleStatusChange = async (driverId: string, newStatus: 'active' | 'inactive') => {
  try {
    const response = await fetch(`/api/drivers/${driverId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      fetchDrivers();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update status');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status');
  }
};

// เพิ่มคอลัมน์ Actions ในตาราง

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Driver
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drivers.map((driver) => (
              <tr key={driver._id}>
                <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex space-x-2">
    {driver.checkInStatus === 'checked-out' ? (
      <button
        onClick={() => handleCheckIn(driver._id)}
        className={`bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 ${
          driver.status === 'inactive' ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={driver.status === 'inactive'}
      >
        Check In
      </button>
    ) : (
      <button
        onClick={() => handleCheckOut(driver._id)}
        className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
      >
        Check Out
      </button>
    )}
    
    <select
      value={driver.status}
      onChange={(e) => handleStatusChange(driver._id, e.target.value as 'active' | 'inactive')}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  </div>
</td>
                <td className="px-6 py-4 whitespace-nowrap">{driver.employeeId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{driver.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{driver.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{driver.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    driver.checkInStatus === 'checked-in' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {driver.checkInStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {driver.checkInStatus === 'checked-out' ? (
                    <button
                      onClick={() => handleCheckIn(driver._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                    >
                      Check In
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckOut(driver._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
                    >
                      Check Out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex min-h-screen items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setShowModal(false)}
      ></div>

      {/* Modal Card */}
      <NeoCard className="relative z-10 w-full max-w-lg p-6">
        <h3 className="text-2xl font-black mb-4">ADD NEW DRIVER</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">FULL NAME</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="neo-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">PHONE NUMBER</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="neo-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">EMAIL ADDRESS</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="neo-input"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <NeoButton type="button" variant="secondary" onClick={() => setShowModal(false)}>
              CANCEL
            </NeoButton>
            <NeoButton type="submit" disabled={loading}>
              {loading ? 'SAVING...' : 'SAVE DRIVER'}
            </NeoButton>
          </div>
        </form>
      </NeoCard>
    </div>
  </div>
)}
    </div>
  );
}

