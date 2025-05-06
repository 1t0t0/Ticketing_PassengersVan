'use client';

import NotionButton from '@/components/ui/NotionButton';
import NotionCard from '@/components/ui/NotionCard';
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

export default function NotionDriversPage() {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-medium text-[#37352F]">Driver Management</h1>
        <NotionButton 
          onClick={() => setShowModal(true)}
          variant="primary"
          size="sm"
        >
          Add driver
        </NotionButton>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, ID, email or phone..."
          className="w-full h-10 px-3 py-2 bg-white border border-[#E9E9E8] rounded-sm focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] text-sm"
        />
      </div>

      <NotionCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F6F3] border-b border-[#E9E9E8]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E9E9E8]">
              {currentDrivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-[#F7F6F3]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#37352F]">{driver.employeeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#37352F]">{driver.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#37352F]">{driver.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#37352F]">{driver.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-sm ${
                      driver.checkInStatus === 'checked-in' 
                        ? 'bg-[#E9F7F1] text-[#0F7B0F]' 
                        : 'bg-[#F7F6F3] text-[#6B6B6B]'
                    }`}>
                      {driver.checkInStatus === 'checked-in' ? 'Checked in' : 'Checked out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {driver.checkInStatus === 'checked-out' ? (
                      <NotionButton
                        onClick={() => handleCheckIn(driver._id)}
                        variant="success"
                        size="sm"
                        className={driver.status === 'inactive' ? 'opacity-50 cursor-not-allowed' : ''}
                        disabled={driver.status === 'inactive'}
                      >
                        Check in
                      </NotionButton>
                    ) : (
                      <NotionButton
                        onClick={() => handleCheckOut(driver._id)}
                        variant="danger"
                        size="sm"
                      >
                        Check out
                      </NotionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex justify-between items-center border-t border-[#E9E9E8]">
            <div className="text-sm text-[#6B6B6B]">
              Showing <span className="font-medium">{indexOfFirstDriver + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastDriver, filteredDrivers.length)}
              </span>{" "}
              of <span className="font-medium">{filteredDrivers.length}</span> drivers
            </div>
            <div className="flex space-x-2">
              <NotionButton
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
                variant="secondary"
                className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
              >
                Previous
              </NotionButton>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                return (
                  <NotionButton
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    size="sm"
                    variant={currentPage === pageNumber ? "primary" : "secondary"}
                  >
                    {pageNumber}
                  </NotionButton>
                );
              })}
              <NotionButton
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                size="sm"
                variant="secondary"
                className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
              >
                Next
              </NotionButton>
            </div>
          </div>
        )}
      </NotionCard>

      {/* No Results Message */}
      {currentDrivers.length === 0 && (
        <div className="text-center py-10">
          <p className="text-[#6B6B6B]">No drivers found matching your search.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/30 transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-lg bg-white border border-[#E9E9E8] rounded-sm shadow-sm p-6">
              <h3 className="text-xl font-medium text-[#37352F] mb-4">Add new driver</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-1">Full name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-9 px-3 py-2 bg-white border border-[#E9E9E8] rounded-sm focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-1">Phone number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-9 px-3 py-2 bg-white border border-[#E9E9E8] rounded-sm focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B6B6B] mb-1">Email address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-9 px-3 py-2 bg-white border border-[#E9E9E8] rounded-sm focus:outline-none focus:border-[#2383E2] focus:ring-1 focus:ring-[#2383E2] text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <NotionButton 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </NotionButton>
                  <NotionButton 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save driver'}
                  </NotionButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}