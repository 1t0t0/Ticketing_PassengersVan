'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import { 
  FiMail, 
  FiPhone, 
  FiEdit2, 
  FiTrash2, 
  FiUser, 
  FiHome, 
  FiMapPin, 
  FiLogIn, 
  FiLogOut,
  FiSearch,
} from 'react-icons/fi';

import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import useConfirmation from '@/hooks/useConfirmation';
import notificationService from '@/lib/notificationService';

// Interfaces
interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
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

// Type definitions
type UserTab = 'drivers' | 'staff' | 'admin' | 'station' | 'search';

// Constants
const DEFAULT_USER: User = {
  name: '',
  email: '',
  password: '',
  role: 'driver',
  phone: '',
};

const DEFAULT_CAR: Car = {
  car_name: '',
  car_capacity: 10,
  car_registration: '',
};

export default function UserManagementPage() {
  // Hooks
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    isConfirmDialogOpen,
    confirmMessage,
    showConfirmation,
    handleConfirm,
    handleCancel
  } = useConfirmation();

  // State - User data
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ticketSellers, setTicketSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [stations, setStations] = useState<User[]>([]);
  
  // State - UI
  const [activeTab, setActiveTab] = useState<UserTab>('drivers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingInOut, setCheckingInOut] = useState<{[key: string]: boolean}>({});
  
  // State - Form data
  const [newUser, setNewUser] = useState<User>({...DEFAULT_USER});
  const [newCar, setNewCar] = useState<Car>({...DEFAULT_CAR});
  
  // State - Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRole, setSearchRole] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Authorization & Role-based functions
  const isAdmin = useCallback(() => {
    return session?.user?.role === 'admin';
  }, [session?.user?.role]);
  
  const isStaff = useCallback(() => {
    return session?.user?.role === 'staff';
  }, [session?.user?.role]);
  
  const canShowCheckInOutButton = useCallback((user: User) => {
    if (!['driver', 'staff'].includes(user.role)) {
      return false;
    }
    
    if (isStaff() && user.role === 'staff' && user._id !== session?.user?.id) {
      return false;
    }
    
    return true;
  }, [isStaff, session?.user?.id]);
  
  const canEditUser = useCallback((user: User) => {
    return isAdmin();
  }, [isAdmin]);
  
  const canDeleteUser = useCallback((user: User) => {
    return isAdmin();
  }, [isAdmin]);
  
  const canAddUser = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);
  
  const shouldShowTab = useCallback((tab: UserTab) => {
    if (isAdmin()) {
      return true;
    }
    
    if (isStaff()) {
      return ['drivers', 'search'].includes(tab);
    }
    
    return false;
  }, [isAdmin, isStaff]);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  // Initial data fetch
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchUsers();
    }
  }, [status, session]);
  
  // API interactions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      // Filter users by role
      setDrivers(data.filter((user: User) => user.role === 'driver'));
      setTicketSellers(data.filter((user: User) => user.role === 'staff'));
      setAdmins(data.filter((user: User) => user.role === 'admin'));
      setStations(data.filter((user: User) => user.role === 'station'));
      
      // Fetch assigned cars for drivers
      const driverIds = data
        .filter((user: User) => user.role === 'driver')
        .map((driver: User) => driver._id);
      
      if (driverIds.length > 0) {
        const carsResponse = await fetch('/api/cars');
        
        if (!carsResponse.ok) {
          throw new Error('Failed to fetch cars');
        }
        
        const carsData = await carsResponse.json();
        
        // Map cars to drivers
        const driversWithCars = data
          .filter((user: User) => user.role === 'driver')
          .map((driver: Driver) => {
            const assignedCar = carsData.find((car: Car) => car.user_id === driver._id);
            return { ...driver, assignedCar };
          });
        
        setDrivers(driversWithCars);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Form validation
      if (!newUser.name || !newUser.email || !newUser.password) {
        notificationService.error('ກະລຸນາກວດສອບຂໍ້ມູນທີ່ຈຳເປັນ');
        setLoading(false);
        return;
      }
      
      // Role-specific validation
      if (newUser.role === 'driver') {
        if (!newCar.car_name || !newCar.car_registration) {
          notificationService.error('ກະລຸນາກວດສອບຂໍ້ມູນລົດທີ່ຈຳເປັນ');
          setLoading(false);
          return;
        }
      } else if (newUser.role === 'station') {
        if (!newUser.name) {
          notificationService.error('ກະລຸນາລະບຸຊື່ສະຖານີ');
          setLoading(false);
          return;
        }
      }
      
      // Prepare user data
      const userData = prepareUserData(newUser);
      
      // Create user
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      const createdUser = await userResponse.json();
      
      // Create car if user is driver
      if (newUser.role === 'driver') {
        await createCarForDriver(createdUser._id);
      }
      
      // Reset form and refresh
      resetForm();
      setShowAddModal(false);
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error adding user:', error);
      notificationService.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const prepareUserData = (user: User) => {
    const userData: any = {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    };
    
    // Add role-specific fields
    if (user.role === 'driver' || user.role === 'staff') {
      if (user.phone) userData.phone = user.phone;
      userData.status = 'active';
      userData.checkInStatus = 'checked-out';
    } else if (user.role === 'station') {
      if (user.phone) userData.phone = user.phone;
      if ((user as any).location) userData.location = (user as any).location;
    }
    
    return userData;
  };
  
  const createCarForDriver = async (driverId: string) => {
    const carResponse = await fetch('/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_name: newCar.car_name,
        car_capacity: newCar.car_capacity,
        car_registration: newCar.car_registration,
        user_id: driverId,
      }),
    });
    
    if (!carResponse.ok) {
      const errorData = await carResponse.json();
      // Delete user if car creation fails
      await fetch(`/api/users/${driverId}`, { method: 'DELETE' });
      throw new Error(errorData.error || 'Failed to create car');
    }
  };
  
  const resetForm = () => {
    setNewUser({...DEFAULT_USER, role: newUser.role});
    setNewCar({...DEFAULT_CAR});
  };
  
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
      
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating check in status:', error);
      notificationService.error(`Error: ${error.message}`);
    } finally {
      setCheckingInOut(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const handleDeleteUser = async (userId: string, role: string) => {
    showConfirmation('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຜູ້ໃຊ້ນີ້?', async () => {
      try {
        setLoading(true);
        
        // Delete related car if user is driver
        if (role === 'driver') {
          await deleteDriverCars(userId);
        }
        
        // Delete user
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }
        
        fetchUsers();
        notificationService.success('ລຶບຜູ້ໃຊ້ສຳເລັດແລ້ວ');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການລຶບຜູ້ໃຊ້: ${error.message}`);
      } finally {
        setLoading(false);
      }
    });
  };
  
  const deleteDriverCars = async (driverId: string) => {
    const carResponse = await fetch(`/api/cars/by-driver/${driverId}`, {
      method: 'DELETE',
    });
    
    if (!carResponse.ok) {
      const errorData = await carResponse.json();
      console.error('Failed to delete associated cars:', errorData);
    }
  };
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      notificationService.error('ກະລຸນາລະບຸຄຳຄົ້ນຫາ');
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Build search URL
      let url = `/api/users/search?term=${encodeURIComponent(searchTerm)}`;
      if (searchRole !== 'all') {
        url += `&role=${searchRole}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      setSearchResults(data);
      
    } catch (error: any) {
      console.error('Error searching users:', error);
      notificationService.error(`Error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Tab change handler
  const handleTabChange = (tab: UserTab) => {
    setActiveTab(tab);
    if (tab !== 'search') {
      let userRole: 'admin' | 'staff' | 'driver' | 'station' = 'driver';
      if (tab === 'admin') userRole = 'admin';
      if (tab === 'staff') userRole = 'staff';
      if (tab === 'station') userRole = 'station';
      if (tab === 'drivers') userRole = 'driver';
      
      setNewUser(prev => ({...prev, role: userRole}));
    }
  };

  // UI Components
  const renderTabs = () => {
    const allTabs: UserTab[] = ['drivers', 'staff', 'station', 'admin', 'search'];
    
    return (
      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        {allTabs.map(tab => {
          if (!shouldShowTab(tab)) {
            return null;
          }
          
          let label = '';
          switch (tab) {
            case 'drivers': label = 'Drivers'; break;
            case 'staff': label = 'Ticket Sellers'; break;
            case 'station': label = 'Stations'; break;
            case 'admin': label = 'Administrators'; break;
            case 'search': label = (<><FiSearch className="inline mr-1" /> Search</>); break;
          }
          
          return (
            <button
              key={tab}
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };
  
  const renderSearchPanel = () => {
    if (activeTab !== 'search') return null;
    
    return (
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-4">ຄົ້ນຫາຜູ້ໃຊ້</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">ຄຳຄົ້ນຫາ</label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 rounded p-2"
              placeholder="ຊື່, ອີເມລ, ໂທລະສັບ, ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">ປະເພດຜູ້ໃຊ້</label>
            <select
              className="w-full border-2 border-gray-300 rounded p-2"
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
            >
              <option value="all">ທັງໝົດ</option>
              <option value="driver">ຄົນຂັບລົດ</option>
              {isAdmin() && (
                <>
                  <option value="staff">ພະນັກງານຂາຍປີ້</option>
                  <option value="station">ສະຖານີ</option>
                  <option value="admin">ຜູ້ບໍລິຫານລະບົບ</option>
                </>
              )}
            </select>
          </div>
          
          <div className="flex items-end">
            <NeoButton 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full"
            >
              {isSearching ? 'ກຳລັງຄົ້ນຫາ...' : 'ຄົ້ນຫາ'}
            </NeoButton>
          </div>
        </div>
      </div>
    );
  };
  
  const renderAddUserModal = () => {
    if (!showAddModal) return null;
    
    const modalTitle = activeTab === 'drivers' ? 'ເພີ່ມຄົນຂັບລົດ' : 
                      activeTab === 'staff' ? 'ເພີ່ມພະນັກງານຂາຍປີ້' : 
                      activeTab === 'station' ? 'ເພີ່ມສະຖານີ' : 'ເພີ່ມຜູ້ບໍລິຫານລະບົບ';
    
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl mx-4 shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{modalTitle}</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label="ຊື່ ແລະ ນາມສະກຸນ"
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
                
                <FormField 
                  label="ອີເມວ"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
                
                <FormField 
                  label="ເບີໂທລະສັບ"
                  type="tel"
                  placeholder="12345678"
                  value={newUser.phone || ''}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                />
                
                <FormField 
                  label="ລະຫັດຜ່ານ"
                  type="password"
                  value={newUser.password || ''}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
                
                {activeTab === 'station' && (
                  <FormField 
                    label="ສະຖານທີ່ຕັ້ງ"
                    type="text"
                    placeholder="ບ້ານ ນາໄຊ, ເມືອງ ຫຼວງພະບາງ"
                    value={(newUser as any).location || ''}
                    onChange={(e) => setNewUser({...newUser, location: e.target.value} as any)}
                    required
                  />
                )}
              </div>
              
              {/* Car information for drivers */}
              {activeTab === 'drivers' && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold mb-4">ຂໍ້ມູນລົດ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField 
                      label="ຊື່ລົດ"
                      type="text"
                      placeholder="Toyota Hiace"
                      value={newCar.car_name}
                      onChange={(e) => setNewCar({...newCar, car_name: e.target.value})}
                      required
                    />
                    
                    <FormField 
                      label="ຄວາມຈຸຜູ້ໂດຍສານ"
                      type="number"
                      value={newCar.car_capacity.toString()}
                      onChange={(e) => setNewCar({...newCar, car_capacity: parseInt(e.target.value)})}
                      required
                      min="1"
                    />
                    
                    <FormField 
                      label="ປ້າຍທະບຽນລົດ"
                      type="text"
                      placeholder="12ກຂ 3456"
                      value={newCar.car_registration}
                      onChange={(e) => setNewCar({...newCar, car_registration: e.target.value})}
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowAddModal(false)}
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };
  
  const renderUsers = () => {
    // Get appropriate user list based on active tab
    const getUsersForTab = (): { users: User[], userType: string } => {
      switch (activeTab) {
        case 'drivers': return { users: drivers, userType: 'ຄົນຂັບລົດ' };
        case 'staff': return { users: ticketSellers, userType: 'ພະນັກງານຂາຍປີ້' };
        case 'admin': return { users: admins, userType: 'ຜູ້ບໍລິຫານລະບົບ' };
        case 'station': return { users: stations, userType: 'ສະຖານີ' };
        case 'search': return { users: searchResults, userType: 'ຜົນການຄົ້ນຫາ' };
      }
    };
    
    const { users, userType } = getUsersForTab();
    
    // Show loading state
    if ((activeTab === 'search' && isSearching) || (activeTab !== 'search' && loading)) {
      return (
        <div className="text-center py-8">
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      );
    }
    
    // Show empty state
    if (users.length === 0) {
      return (
        <div className="text-center py-8">
          <p>ບໍ່ມີຂໍ້ມູນ{userType}</p>
        </div>
      );
    }
    
    // Render user list
    return users.map((user) => <UserCard 
      key={user._id} 
      user={user} 
      admins={admins}
      onCheckInOut={handleCheckInOut}
      onEdit={(userId) => router.push(`/dashboard/users/edit/${userId}`)}
      onDelete={handleDeleteUser}
      checkingInOut={checkingInOut}
      canShowCheckInOutButton={canShowCheckInOutButton}
      canEditUser={canEditUser}
      canDeleteUser={canDeleteUser}
    />);
  };

  // Main render
  if (status === 'unauthenticated' || (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || ''))) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ຈັດການຜູ້ໃຊ້ລະບົບ</h1>
        {canAddUser() && (
          <NeoButton onClick={() => setShowAddModal(true)}>
            ເພີ່ມຜູ້ໃຊ້ລະບົບ
          </NeoButton>
        )}
      </div>
      
      <NeoCard className="overflow-hidden mb-6">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">User Directory</h2>
          {renderTabs()}
          {renderSearchPanel()}
          <div>{renderUsers()}</div>
        </div>
      </NeoCard>
      
      {canAddUser() && renderAddUserModal()}

      <ConfirmationDialog 
        isOpen={isConfirmDialogOpen}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

// Supporting Components
interface FormFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
}

function FormField({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  required, 
  min 
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <input
        type={type}
        className="w-full border-2 border-gray-300 rounded p-2"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
      />
    </div>
  );
}

interface UserCardProps {
  user: User;
  admins: User[];
  onCheckInOut: (userId: string, currentStatus: string) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string, role: string) => void;
  checkingInOut: {[key: string]: boolean};
  canShowCheckInOutButton: (user: User) => boolean;
  canEditUser: (user: User) => boolean;
  canDeleteUser: (user: User) => boolean;
}

function UserCard({ 
  user, 
  admins,
  onCheckInOut, 
  onEdit, 
  onDelete,
  checkingInOut,
  canShowCheckInOutButton,
  canEditUser,
  canDeleteUser
}: UserCardProps) {
  const isDriver = user.role === 'driver';
  const isStaffUser = user.role === 'staff';
  const isStation = user.role === 'station';
  const showCheckInOut = canShowCheckInOutButton(user);
  const showEditButton = canEditUser(user);
  const showDeleteButton = canDeleteUser(user) && !(user.role === 'admin' && admins.length <= 1);
  
  // Get appropriate CSS classes based on user role
  const getRoleClasses = () => {
    if (isDriver) return { bg: 'bg-blue-100', text: 'text-blue-500' };
    if (isStation) return { bg: 'bg-yellow-100', text: 'text-yellow-500' };
    if (isStaffUser) return { bg: 'bg-green-100', text: 'text-green-500' };
    return { bg: 'bg-purple-100', text: 'text-purple-500' };
  };
  
  const { bg, text } = getRoleClasses();
  
  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <div className="p-4 flex flex-wrap items-center">
        {/* Avatar */}
        <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mr-4`}>
          <FiUser size={24} className={text} />
        </div>
        
        {/* User main info */}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold truncate">{user.name}</div>
          
          {/* IDs */}
          {isDriver && (user as any).employeeId && (
            <div className="text-sm text-gray-500">ID: {(user as any).employeeId}</div>
          )}
          {isStaffUser && (user as any).employeeId && (
            <div className="text-sm text-gray-500">ID: {(user as any).employeeId}</div>
          )}
          {isStation && (user as any).stationId && (
            <div className="text-sm text-gray-500">ID: {(user as any).stationId}</div>
          )}
          
          {/* Location for stations */}
          {isStation && (user as any).location && (
            <div className="text-sm text-gray-500">
              <FiMapPin size={14} className="inline mr-1" />
              {(user as any).location}
            </div>
          )}
          
          {/* Check-in status badge */}
          {(isDriver || isStaffUser) && (
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                user.checkInStatus === 'checked-in' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {user.checkInStatus === 'checked-in' ? 'Checked-In' : 'Checked-Out'}
              </span>
            </div>
          )}
        </div>
        
        {/* Contact info */}
        <div className="flex items-center space-x-4 mr-4 flex-wrap">
          <div className="flex items-center m-2">
            <FiMail size={18} className="text-gray-400 mr-2" />
            <span>{user.email}</span>
          </div>
          
          {user.phone && (
            <div className="flex items-center m-2">
              <FiPhone size={18} className="text-gray-400 mr-2" />
              <span>{user.phone}</span>
            </div>
          )}
          
          {isStation && (user as any).stationName && (
            <div className="flex items-center m-2">
              <FiHome size={18} className="text-gray-400 mr-2" />
              <span>{(user as any).stationName}</span>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2 flex-wrap">
          {/* Check-in/Check-out button */}
          {showCheckInOut && (
            <div className="m-1">
              <NeoButton
                variant={user.checkInStatus === 'checked-in' ? 'danger' : 'success'}
                size="sm"
                onClick={() => onCheckInOut(user._id!, user.checkInStatus || 'checked-out')}
                disabled={checkingInOut[user._id!]}
                className="flex items-center"
              >
                {checkingInOut[user._id!] ? (
                  'กำลังดำเนินการ...' 
                ) : (
                  <>
                    {user.checkInStatus === 'checked-in' ? (
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
          )}
          
          {/* Edit button - Admin only */}
          {showEditButton && (
            <div className="m-1">
              <button 
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                onClick={() => onEdit(user._id!)}
              >
                <FiEdit2 size={18} />
              </button>
            </div>
          )}
          
          {/* Delete button - Admin only */}
          {showDeleteButton && (
            <div className="m-1">
              <button 
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                onClick={() => onDelete(user._id!, user.role)}
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}