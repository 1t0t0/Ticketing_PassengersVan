'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import { 
  FiMail, 
  FiPhone, 
  FiLogIn, 
  FiLogOut, 
  FiSearch, 
  FiFilter, 
  FiUser,
  FiTruck,
  FiSettings,
  FiCar,
  FiTag
} from 'react-icons/fi';

// Define interfaces for our data types
interface CarType {
  _id: string;
  carType_id: string;
  carType_name: string;
}

interface Car {
  _id?: string;
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id?: string;
  user_id?: string;
  carType?: CarType;
}

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
  userImage?: string;
}

interface Driver extends User {
  assignedCars?: Car[];
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
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  // Fetch drivers data with cars
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchDriversWithCars();
    }
  }, [status, session]);
  
  // Function to fetch drivers with their assigned cars
  const fetchDriversWithCars = async () => {
    try {
      setLoading(true);
      
      // Fetch all drivers
      const driversResponse = await fetch('/api/users?role=driver');
      const driversData = await driversResponse.json();
      
      // Fetch all cars with populated CarType data
      const carsResponse = await fetch('/api/cars');
      const carsData = await carsResponse.json();
      
      console.log('Cars data with types:', carsData); // Debug log
      
      // Map cars to drivers
      const driversWithCars = driversData.map((driver: Driver) => {
        const assignedCars = carsData.filter((car: Car) => car.user_id === driver._id);
        return { ...driver, assignedCars };
      });
      
      setDrivers(driversWithCars);
    } catch (error) {
      console.error('Error fetching drivers with cars:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for check in / check out
  const handleCheckInOut = async (userId: string, currentStatus: string) => {
    try {
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
      fetchDriversWithCars();
      
    } catch (error: any) {
      console.error('Error updating check in status:', error);
      alert(`Error: ${error.message}`);
    } finally {
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
      
      if (session?.user?.role === 'admin') {
        const url = `/api/users/search?term=${encodeURIComponent(searchTerm)}&role=driver`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to search drivers');
        }
        
        const data = await response.json();
        
        // Also fetch cars for search results
        const carsResponse = await fetch('/api/cars');
        const carsData = await carsResponse.json();
        
        const resultsWithCars = data.map((driver: Driver) => {
          const assignedCars = carsData.filter((car: Car) => car.user_id === driver._id);
          return { ...driver, assignedCars };
        });
        
        setSearchResults(resultsWithCars);
      } else {
        // Local search for staff
        const results = drivers.filter(driver => 
          driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (driver.phone && driver.phone.includes(searchTerm)) ||
          (driver.employeeId && driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (driver.assignedCars && driver.assignedCars.some(car => 
            car.car_registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.car_name.toLowerCase().includes(searchTerm.toLowerCase())
          ))
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
  
  // Render car information component - Simplified version
  const renderCarInfo = (cars: Car[]) => {
    if (!cars || cars.length === 0) {
      return (
        <div className="mt-2 text-xs text-gray-500 italic">
          ຍັງບໍ່ມີລົດມອບໝາຍ
        </div>
      );
    }
    
    return (
      <div className="mt-2 text-xs text-gray-600">
        <span className="font-medium">{cars.length} ຄັນ: </span>
        {cars.slice(0, 2).map((car, index) => (
          <span key={car._id || index}>
            {car.car_registration}
            {index < Math.min(cars.length - 1, 1) && ', '}
          </span>
        ))}
        {cars.length > 2 && (
          <span className="text-blue-600"> +{cars.length - 2} ຄັນ</span>
        )}
      </div>
    );
  };
  
  // Rendering drivers list
  const renderDrivers = () => {
    const displayDrivers = searchResults.length > 0 ? searchResults : drivers;
    
    if (loading || isSearching) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      );
    }
    
    if (displayDrivers.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">ບໍ່ມີຂໍ້ມູນຄົນຂັບລົດ</p>
        </div>
      );
    }
    
    return displayDrivers.map((driver) => (
      <div key={driver._id} className="border border-gray-200 rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Driver Header */}
        <div className="p-4 bg-white">
          <div className="flex flex-wrap items-start">
            {/* Avatar */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4 overflow-hidden">
              {driver.userImage ? (
                <img 
                  src={driver.userImage} 
                  alt={driver.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser size={28} className="text-blue-500" />
              )}
            </div>
            
            {/* Driver Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold truncate">{driver.name}</h3>
                {/* Check-in status badge */}
                <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                  driver.checkInStatus === 'checked-in' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {driver.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກແລ້ວ' : 'ຍັງບໍ່ໄດ້ເຂົ້າວຽກ'}
                </span>
              </div>
              
              {driver.employeeId && (
                <div className="text-sm text-gray-500 mb-2">ID: {driver.employeeId}</div>
              )}
              
              {/* Contact info */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <FiMail size={16} className="text-gray-400 mr-2" />
                  <span>{driver.email}</span>
                </div>
                {driver.phone && (
                  <div className="flex items-center">
                    <FiPhone size={16} className="text-gray-400 mr-2" />
                    <span>{driver.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action button */}
            <div className="flex items-center ml-4">
              <NeoButton
                variant={driver.checkInStatus === 'checked-in' ? 'danger' : 'success'}
                size="sm"
                onClick={() => handleCheckInOut(driver._id!, driver.checkInStatus || 'checked-out')}
                disabled={checkingInOut[driver._id!]}
                className="flex items-center"
              >
                {checkingInOut[driver._id!] ? (
                  'ກຳລັງດຳເນີນການ...' 
                ) : (
                  <>
                    {driver.checkInStatus === 'checked-in' ? (
                      <>
                        <FiLogOut className="mr-1" /> ອອກວຽກ
                      </>
                    ) : (
                      <>
                        <FiLogIn className="mr-1" /> ເຂົ້າວຽກ
                      </>
                    )}
                  </>
                )}
              </NeoButton>
            </div>
          </div>
          
          {/* Car Information Section - Simplified */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiCar className="text-gray-500 mr-2" size={14} />
                <span className="text-sm text-gray-600">ລົດທີ່ຮັບຜິດຊອບ:</span>
              </div>
              {driver.assignedCars && driver.assignedCars.length > 0 && (
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                  onClick={() => {/* Could open detailed view */}}
                >
                  ເບິ່ງລາຍລະອຽດ
                </button>
              )}
            </div>
            {renderCarInfo(driver.assignedCars || [])}
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
        <div>
          <h1 className="text-2xl font-bold">ຄົນຂັບລົດ</h1>
          <p className="text-gray-600 mt-1">ຈັດການຂໍ້ມູນຄົນຂັບລົດ ແລະ ລົດທີ່ຮັບຜິດຊອບ</p>
        </div>
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
            onClick={fetchDriversWithCars}
            className="flex items-center"
            disabled={loading}
          >
            {loading ? 'ກຳລັງໂຫລດ...' : 'ໂຫລດຂໍ້ມູນໃໝ່'}
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
                className="w-full border-2 border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                placeholder="ຊື່, ອີເມລ, ໂທລະສັບ, ID, ທະບຽນລົດ, ຊື່ລົດ"
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
          {!searchResults.length && drivers.length > 0 && (
            <div className="text-sm text-gray-500">
              ທັງໝົດ: {drivers.length} ຄົນ, ມີລົດ: {drivers.filter(d => d.assignedCars && d.assignedCars.length > 0).length} ຄົນ
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