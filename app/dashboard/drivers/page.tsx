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
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const driversPerPage = 10;

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    // Filter drivers based on search query
    const filtered = drivers.filter(driver => 
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDrivers(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, drivers]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      const data = await response.json();
      setDrivers(data);
      setFilteredDrivers(data);
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



  // Calculate pagination
  const indexOfLastDriver = currentPage * driversPerPage;
  const indexOfFirstDriver = indexOfLastDriver - driversPerPage;
  const currentDrivers = filteredDrivers.slice(indexOfFirstDriver, indexOfLastDriver);
  const totalPages = Math.ceil(filteredDrivers.length / driversPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">DRIVER MANAGEMENT</h1>
        <NeoButton 
          onClick={() => setShowModal(true)}
          className="bg-neo-blue"
        >
          ADD DRIVER
        </NeoButton>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <NeoCard className="p-4">
          <div className="flex items-center">
            <label className="font-bold mr-3">SEARCH:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, email or phone..."
              className="neo-input w-full"
            />
          </div>
        </NeoCard>
      </div>

      <NeoCard className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-neo-blue">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentDrivers.map((driver) => (
              <tr key={driver._id}>
                <td className="px-6 py-4 whitespace-nowrap">{driver.employeeId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{driver.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{driver.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{driver.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      driver.checkInStatus === 'checked-in' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.checkInStatus}
                    </span>
                 
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {driver.checkInStatus === 'checked-out' ? (
                    <NeoButton
                      onClick={() => handleCheckIn(driver._id)}
                      variant="success"
                      size="sm"
                      className={driver.status === 'inactive' ? 'opacity-50 cursor-not-allowed' : ''}
                      disabled={driver.status === 'inactive'}
                    >
                      Check In
                    </NeoButton>
                  ) : (
                    <NeoButton
                      onClick={() => handleCheckOut(driver._id)}
                      variant="danger"
                      size="sm"
                    >
                      Check Out
                    </NeoButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstDriver + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastDriver, filteredDrivers.length)}
              </span>{" "}
              of <span className="font-medium">{filteredDrivers.length}</span> drivers
            </div>
            <div className="flex space-x-2">
              <NeoButton
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
                variant="secondary"
                className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
              >
                Previous
              </NeoButton>
              {Array.from({ length: totalPages }, (_, i) => (
                <NeoButton
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  size="sm"
                  variant={currentPage === i + 1 ? "primary" : "secondary"}
                >
                  {i + 1}
                </NeoButton>
              ))}
              <NeoButton
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                size="sm"
                variant="secondary"
                className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
              >
                Next
              </NeoButton>
            </div>
          </div>
        )}
      </NeoCard>

      {/* No Results Message */}
      {currentDrivers.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 font-bold">No drivers found matching your search.</p>
        </div>
      )}

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