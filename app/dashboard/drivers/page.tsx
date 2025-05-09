'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import { FiMail, FiPhone, FiLogIn, FiLogOut, FiSearch, FiFilter, FiUser } from 'react-icons/fi';

// Define interfaces for our data types
interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'driver' | 'station';
  phone?: string;
  employeeId?: string;
  stationId?: string;
  stationName?: string;
  location?: string;
  status?: 'active' | 'inactive';
  checkInStatus?: 'checked-in' | 'checked-out';
  lastCheckIn?: Date;
  lastCheckOut?: Date;
}

interface Car {
  _id?: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  user_id?: string;
}

interface Driver extends User {
  assignedCar?: Car;
}

export default function DriversManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for drivers list
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Driver[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [checkingInOut, setCheckingInOut] = useState<{[key: string]: boolean}>({});
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      // Only admin and staff can access this page
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  // Fetch drivers data
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchDrivers();
    }
  }, [status, session]);
  
  // Function to fetch drivers
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users with role=driver
      const response = await fetch('/api/users?role=driver');
      const data = await response.json();
      
      // Fetch assigned cars for drivers
      const driverIds = data.map((driver: User) => driver._id);
      
      if (driverIds.length > 0) {
        const carsResponse = await fetch('/api/cars');
        const carsData = await carsResponse.json();
        
        // Map cars to drivers
        const driversWithCars = data.map((driver: Driver) => {
          const assignedCar = carsData.find((car: Car) => car.user_id === driver._id);
          return { ...driver, assignedCar };
        });
        
        setDrivers(driversWithCars);
      } else {
        setDrivers(data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for check in / check out
  const handleCheckInOut = async (userId: string, currentStatus: string) => {
    try {
      // Set loading state for this user
      setCheckingInOut(prev => ({ ...prev, [userId]: true }));
      
      const newStatus = currentStatus === 'checked-in' ? 'checked-out' : 'checked-in';
      
      const response = await fetch(`/api/users/${userId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInStatus: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update check in status');
      }
      
      // Refresh data
      fetchDrivers();
      
    } catch (error: any) {
      console.error('Error updating check in status:', error);
      alert(`Error: ${error.message}`);
    } finally {
      // Clear loading state for this user
      setCheckingInOut(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Filter locally for staff, or use API for admin
      if (session?.user?.role === 'admin') {
        // Use API for admin
        const url = `/api/users/search?term=${encodeURIComponent(searchTerm)}&role=driver`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to search drivers');
        }
        
        const data = await response.json();
        setSearchResults(data);
      } else {
        // Local search for staff (without API call)
        const results = drivers.filter(driver => 
          driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (driver.phone && driver.phone.includes(searchTerm)) ||
          (driver.employeeId && driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        setSearchResults(results);
      }
    } catch (error: any) {
      console.error('Error searching drivers:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Rendering drivers list
  const renderDrivers = () => {
    const displayDrivers = searchResults.length > 0 ? searchResults : drivers;
    
    if (loading || isSearching) {
      return (
        <div className="text-center py-8">
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      );
    }
    
    if (displayDrivers.length === 0) {
      return (
        <div className="text-center py-8">
          <p>ບໍ່ມີຂໍ້ມູນຄົນຂັບລົດ</p>
        </div>
      );
    }
    
    return displayDrivers.map((driver) => (
      <div key={driver._id} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        <div className="p-4 flex flex-wrap items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <FiUser size={24} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold truncate">{driver.name}</div>
            {driver.employeeId && (
              <div className="text-sm text-gray-500">ID: {driver.employeeId}</div>
            )}
            {/* Check-in status badge */}
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                driver.checkInStatus === 'checked-in' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {driver.checkInStatus === 'checked-in' ? 'Checked-In' : 'Checked-Out'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 mr-4 flex-wrap">
            <div className="flex items-center m-2">
              <FiMail size={18} className="text-gray-400 mr-2" />
              <span>{driver.email}</span>
            </div>
            {driver.phone && (
              <div className="flex items-center m-2">
                <FiPhone size={18} className="text-gray-400 mr-2" />
                <span>{driver.phone}</span>
              </div>
            )}
            {driver.assignedCar && (
              <div className="flex items-center m-2">
                <span className="text-gray-400 mr-2">🚐</span>
                <span>{driver.assignedCar.car_registration} ({driver.assignedCar.car_name})</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {/* Check-in/Check-out button */}
            <NeoButton
              variant={driver.checkInStatus === 'checked-in' ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleCheckInOut(driver._id!, driver.checkInStatus || 'checked-out')}
              disabled={checkingInOut[driver._id!]}
              className="flex items-center"
            >
              {checkingInOut[driver._id!] ? (
                'กำลังดำเนินการ...' 
              ) : (
                <>
                  {driver.checkInStatus === 'checked-in' ? (
                    <>
                      <FiLogOut className="mr-1" /> Check Out
                    </>
                  ) : (
                    <>
                      <FiLogIn className="mr-1" /> Check In
                    </>
                  )}
                </>
              )}
            </NeoButton>
          </div>
        </div>
      </div>
    ));
  };
  
  // If not authenticated, don't show anything
  if (status === 'unauthenticated' || (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || ''))) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ຄົນຂັບລົດ</h1>
        <div className="flex gap-2">
          <NeoButton 
            variant="secondary"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center"
          >
            <FiSearch className="mr-1" /> ຄົ້ນຫາ
          </NeoButton>
          <NeoButton 
            variant="primary"
            onClick={fetchDrivers}
            className="flex items-center"
          >
            ໂຫລດຂໍ້ມູນໃໝ່
          </NeoButton>
        </div>
      </div>
      
      {/* Search panel */}
      {showSearch && (
        <NeoCard className="mb-6 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">ຄຳຄົ້ນຫາ</label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded p-2"
                placeholder="ຊື່, ອີເມລ, ໂທລະສັບ, ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
            <div className="flex items-end">
              <div className="flex gap-2">
                <NeoButton 
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? 'ກຳລັງຄົ້ນຫາ...' : 'ຄົ້ນຫາ'}
                </NeoButton>
                {searchResults.length > 0 && (
                  <NeoButton 
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                  >
                    ລ້າງການຄົ້ນຫາ
                  </NeoButton>
                )}
              </div>
            </div>
          </div>
        </NeoCard>
      )}
      
      {/* Drivers List */}
      <NeoCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ລາຍຊື່ຄົນຂັບລົດ</h2>
          {searchResults.length > 0 && (
            <div className="text-sm text-gray-500">
              ຜົນການຄົ້ນຫາ: {searchResults.length} ລາຍການ
            </div>
          )}
        </div>
        
        <div>
          {renderDrivers()}
        </div>
      </NeoCard>
    </div>
  );
}