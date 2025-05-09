'use client';

// แก้ไขการตรวจสอบสิทธิ์ที่หน้า User Management
// ให้เปิดให้ Staff เข้าถึงได้ แต่จำกัดฟังก์ชันบางอย่าง

import { useState, useEffect } from 'react';
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
  FiFilter
} from 'react-icons/fi';

// Define interfaces for our data types
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

// Tab options for user categories
type UserTab = 'drivers' | 'staff' | 'admin' | 'station' | 'search';

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for user lists
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ticketSellers, setTicketSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [stations, setStations] = useState<User[]>([]);
  
  // State for active tab - แก้ไขเพิ่มค่าเริ่มต้นที่ drivers เสมอ
  const [activeTab, setActiveTab] = useState<UserTab>('drivers');
  
  // State for add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State for new user data
  const [newUser, setNewUser] = useState<User>({
    name: '',
    email: '',
    password: '',
    role: 'driver',
    phone: '',
  });
  
  // State for new car data
  const [newCar, setNewCar] = useState<Car>({
    car_name: '',
    car_capacity: 10,
    car_registration: '',
  });
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRole, setSearchRole] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [checkingInOut, setCheckingInOut] = useState<{[key: string]: boolean}>({});
  
  // ตรวจสอบสิทธิ์ในการเข้าถึงหน้านี้
  // Check authentication - ปรับให้ staff เข้าถึงได้ด้วย
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || '')) {
      // เฉพาะ admin และ staff เท่านั้นที่สามารถเข้าถึงหน้านี้ได้
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  // Fetch users data
  useEffect(() => {
    if (status === 'authenticated' && ['admin', 'staff'].includes(session?.user?.role || '')) {
      fetchUsers();
    }
  }, [status, session]);
  
  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/users');
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
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // เพิ่มฟังก์ชันตรวจสอบว่าเป็น Admin หรือไม่
  const isAdmin = () => {
    return session?.user?.role === 'admin';
  };
  
  // เพิ่มฟังก์ชันตรวจสอบว่าเป็น Staff หรือไม่
  const isStaff = () => {
    return session?.user?.role === 'staff';
  };
  
  // ตรวจสอบสิทธิ์ในการแสดงปุ่ม Check in/out
  const canShowCheckInOutButton = (user: User) => {
    // ต้องเป็น Driver หรือ Staff เท่านั้น
    if (!['driver', 'staff'].includes(user.role)) {
      return false;
    }
    
    // ถ้าเราเป็น Staff และพยายามเปลี่ยนสถานะของ Staff อื่น
    if (isStaff() && user.role === 'staff' && user._id !== session?.user?.id) {
      return false; // Staff ไม่สามารถเปลี่ยนสถานะของ Staff คนอื่นได้
    }
    
    return true;
  };
  
  // ตรวจสอบสิทธิ์ในการแก้ไขผู้ใช้
  const canEditUser = (user: User) => {
    // Admin สามารถแก้ไขทุกคนได้
    if (isAdmin()) {
      return true;
    }
    
    // Staff ไม่สามารถแก้ไขข้อมูลใดๆ ได้
    return false;
  };
  
  // ตรวจสอบสิทธิ์ในการลบผู้ใช้
  const canDeleteUser = (user: User) => {
    // เฉพาะ Admin เท่านั้นที่สามารถลบได้
    return isAdmin();
  };
  
  // ตรวจสอบสิทธิ์ในการเพิ่มผู้ใช้
  const canAddUser = () => {
    // เฉพาะ Admin เท่านั้นที่สามารถเพิ่มได้
    return isAdmin();
  };
  
  // ตรวจสอบว่าควรแสดง Tab ไหนบ้าง
  const shouldShowTab = (tab: UserTab) => {
    // Admin เห็นทุก Tab
    if (isAdmin()) {
      return true;
    }
    
    // Staff เห็นเฉพาะ Tab drivers และ search
    if (isStaff()) {
      return ['drivers', 'search'].includes(tab);
    }
    
    return false;
  };
  
  // Handler for adding a new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      if (!newUser.name || !newUser.email || !newUser.password) {
        alert('ກະລຸນາກວດສອບຂໍ້ມູນທີ່ຈຳເປັນ');
        setLoading(false);
        return;
      }
      
      // Validate role-specific fields
      if (newUser.role === 'driver') {
        if (!newCar.car_name || !newCar.car_registration) {
          alert('ກະລຸນາກວດສອບຂໍ້ມູນລົດທີ່ຈຳເປັນ');
          setLoading(false);
          return;
        }
      } else if (newUser.role === 'station') {
        if (!newUser.name) {
          alert('ກະລຸນາລະບຸຊື່ສະຖານີ');
          setLoading(false);
          return;
        }
      }
      
      // Step 1: Create user
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      };
      
      // Add role-specific fields
      if (newUser.role === 'driver') {
        if (newUser.phone) userData.phone = newUser.phone;
        userData.status = 'active';
        userData.checkInStatus = 'checked-out';
      } else if (newUser.role === 'staff') {
        if (newUser.phone) userData.phone = newUser.phone;
        userData.status = 'active';
        userData.checkInStatus = 'checked-out';
      } else if (newUser.role === 'station') {
        if (newUser.phone) userData.phone = newUser.phone;
        if ((newUser as any).location) userData.location = (newUser as any).location;
      }
      
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
      
      // If this is a driver, create the associated car
      if (newUser.role === 'driver') {
        const carResponse = await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            car_name: newCar.car_name,
            car_capacity: newCar.car_capacity,
            car_registration: newCar.car_registration,
            user_id: createdUser._id,
          }),
        });
        
        if (!carResponse.ok) {
          const errorData = await carResponse.json();
          // Try to delete the user if car creation fails
          await fetch(`/api/users/${createdUser._id}`, { method: 'DELETE' });
          throw new Error(errorData.error || 'Failed to create car');
        }
      }
      
      // Reset form data
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: newUser.role,
        phone: '',
      });
      
      setNewCar({
        car_name: '',
        car_capacity: 10,
        car_registration: '',
      });
      
      // Close modal and refresh data
      setShowAddModal(false);
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert(`Error: ${error.message}`);
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
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error updating check in status:', error);
      alert(`Error: ${error.message}`);
    } finally {
      // Clear loading state for this user
      setCheckingInOut(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Handler for deleting a user
  const handleDeleteUser = async (userId: string, role: string) => {
    if (!confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຜູ້ໃຊ້ນີ້?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // If deleting a driver, also delete associated car
      if (role === 'driver') {
        await fetch(`/api/cars/by-driver/${userId}`, {
          method: 'DELETE',
        });
      }
      
      // Delete user
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refresh data
      fetchUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      alert('ກະລຸນາລະບຸຄຳຄົ້ນຫາ');
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Build the search query
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
      alert(`Error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };
  
  // ฟังก์ชันสำหรับ render tabs
  const renderTabs = () => {
    const allTabs: UserTab[] = ['drivers', 'staff', 'station', 'admin', 'search'];
    
    return (
      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        {allTabs.map(tab => {
          // ถ้าไม่ควรแสดง Tab นี้ ให้ข้ามไป
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
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'search') {
                  setNewUser({...newUser, role: tab});
                }
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };
  
  // Function to render search panel
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
  
  // Function to render add user modal
  const renderAddUserModal = () => {
    if (!showAddModal) return null;
    
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl mx-4 shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {activeTab === 'drivers' ? 'ເພີ່ມຄົນຂັບລົດ' : 
                 activeTab === 'staff' ? 'ເພີ່ມພະນັກງານຂາຍປີ້' : 
                 activeTab === 'station' ? 'ເພີ່ມສະຖານີ' : 'ເພີ່ມຜູ້ບໍລິຫານລະບົບ'}
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">ຊື່ ແລະ ນາມສະກຸນ</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-300 rounded p-2"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">ອີເມວ</label>
                  <input
                    type="email"
                    className="w-full border-2 border-gray-300 rounded p-2"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">ເບີໂທລະສັບ</label>
                  <input
                    type="tel"
                    className="w-full border-2 border-gray-300 rounded p-2"
                    placeholder="12345678"
                    value={newUser.phone || ''}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">ລະຫັດຜ່ານ</label>
                  <input
                    type="password"
                    className="w-full border-2 border-gray-300 rounded p-2"
                    value={newUser.password || ''}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                
                {activeTab === 'station' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold mb-2">ສະຖານທີ່ຕັ້ງ</label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-300 rounded p-2"
                        placeholder="ບ້ານ ນາໄຊ, ເມືອງ ຫຼວງພະບາງ"
                        value={(newUser as any).location || ''}
                        onChange={(e) => setNewUser({...newUser, location: e.target.value} as any)}
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Car information for drivers */}
              {activeTab === 'drivers' && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold mb-4">ຂໍ້ມູນລົດ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">ຊື່ລົດ</label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-300 rounded p-2"
                        placeholder="Toyota Hiace"
                        value={newCar.car_name}
                        onChange={(e) => setNewCar({...newCar, car_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold mb-2">ຄວາມຈຸຜູ້ໂດຍສານ</label>
                      <input
                        type="number"
                        className="w-full border-2 border-gray-300 rounded p-2"
                        value={newCar.car_capacity}
                        onChange={(e) => setNewCar({...newCar, car_capacity: parseInt(e.target.value)})}
                        required
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold mb-2">ປ້າຍທະບຽນລົດ</label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-300 rounded p-2"
                        placeholder="12ກຂ 3456"
                        value={newCar.car_registration}
                        onChange={(e) => setNewCar({...newCar, car_registration: e.target.value})}
                        required
                      />
                    </div>
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
  
  // ปรับ renderUsers() เพื่อรองรับสิทธิ์ที่แตกต่างกัน
  const renderUsers = () => {
    let users: User[] = [];
    let userType = '';
    
    switch (activeTab) {
      case 'drivers':
        users = drivers;
        userType = 'ຄົນຂັບລົດ';
        break;
      case 'staff':
        users = ticketSellers;
        userType = 'ພະນັກງານຂາຍປີ້';
        break;
      case 'admin':
        users = admins;
        userType = 'ຜູ້ບໍລິຫານລະບົບ';
        break;
      case 'station':
        users = stations;
        userType = 'ສະຖານີ';
        break;
      case 'search':
        users = searchResults;
        userType = 'ຜົນການຄົ້ນຫາ';
        break;
    }
    
    if ((activeTab === 'search' && isSearching) || (activeTab !== 'search' && loading)) {
      return (
        <div className="text-center py-8">
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      );
    }
    
    if (users.length === 0) {
      return (
        <div className="text-center py-8">
          <p>ບໍ່ມີຂໍ້ມູນ{userType}</p>
        </div>
      );
    }
    
    return users.map((user) => {
      const isDriver = user.role === 'driver';
      const isStaffUser = user.role === 'staff';
      const isStation = user.role === 'station';
      const showCheckInOut = canShowCheckInOutButton(user);
      const showEditButton = canEditUser(user);
      const showDeleteButton = canDeleteUser(user) && !(user.role === 'admin' && admins.length <= 1);
      
      return (
        <div key={user._id} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
          <div className="p-4 flex flex-wrap items-center">
            <div className={`w-12 h-12 ${
              isDriver ? 'bg-blue-100' : 
              isStation ? 'bg-yellow-100' :
              isStaffUser ? 'bg-green-100' : 'bg-purple-100'
            } rounded-full flex items-center justify-center mr-4`}>
              <FiUser size={24} className={`
                ${isDriver ? 'text-blue-500' : 
                  isStation ? 'text-yellow-500' :
                  isStaffUser ? 'text-green-500' : 'text-purple-500'}
              `} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-semibold truncate">{user.name}</div>
              {isDriver && (user as any).employeeId && (
                <div className="text-sm text-gray-500">ID: {(user as any).employeeId}</div>
              )}
              {isStaffUser && (user as any).employeeId && (
                <div className="text-sm text-gray-500">ID: {(user as any).employeeId}</div>
              )}
              {isStation && (user as any).stationId && (
                <div className="text-sm text-gray-500">ID: {(user as any).stationId}</div>
              )}
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
            <div className="flex space-x-2 flex-wrap">
              {/* Check-in/Check-out button */}
              {showCheckInOut && (
                <div className="m-1">
                  <NeoButton
                    variant={user.checkInStatus === 'checked-in' ? 'danger' : 'success'}
                    size="sm"
                    onClick={() => handleCheckInOut(user._id!, user.checkInStatus || 'checked-out')}
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
              {/* Edit button - เฉพาะ Admin */}
              {showEditButton && (
                <div className="m-1">
                  <button 
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                    onClick={() => router.push(`/dashboard/users/edit/${user._id}`)}
                  >
                    <FiEdit2 size={18} />
                  </button>
                </div>
              )}
              {/* Delete button - เฉพาะ Admin */}
              {showDeleteButton && (
                <div className="m-1">
                  <button 
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    onClick={() => handleDeleteUser(user._id!, user.role)}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };
  
  // ปรับส่วนการแสดงผลเพื่อรองรับสิทธิ์ที่แตกต่างกัน
  if (status === 'unauthenticated' || (status === 'authenticated' && !['admin', 'staff'].includes(session?.user?.role || ''))) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ຈັດການຜູ້ໃຊ້ລະບົບ</h1>
        {/* แสดงปุ่มเพิ่มผู้ใช้เฉพาะ Admin เท่านั้น */}
        {canAddUser() && (
          <NeoButton onClick={() => setShowAddModal(true)}>
            ເພີ່ມຜູ້ໃຊ້ລະບົບ
          </NeoButton>
        )}
      </div>
      
      {/* User Directory section */}
      <NeoCard className="overflow-hidden mb-6">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">User Directory</h2>
          
          {/* Tabs ที่แสดงตามสิทธิ์ */}
          {renderTabs()}
          
          {/* Search panel */}
          {renderSearchPanel()}
          
          {/* User list */}
          <div>
            {renderUsers()}
          </div>
        </div>
      </NeoCard>
      
      {/* Add user modal - แสดงเฉพาะ Admin */}
      {canAddUser() && renderAddUserModal()}
    </div>
  );
}