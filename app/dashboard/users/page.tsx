'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import NeoButton from '@/components/ui/NotionButton';
import { FiMail, FiPhone, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';

// Define interfaces for our data types
interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff' | 'driver';
  phone?: string;
  employeeId?: string;
}

interface Car {
  _id?: string;
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  user_id?: string;
}

interface Driver extends User {
  assignedCar?: Car;
}

// Tab options for user categories
type UserTab = 'drivers' | 'staff' | 'admin';

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for user lists
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ticketSellers, setTicketSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  
  // State for active tab
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
    employeeId: '',
  });
  
  // State for new car data
  const [newCar, setNewCar] = useState<Car>({
    car_id: '',
    car_name: '',
    car_capacity: 10,
    car_registration: '',
  });
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      // Only admin should access this page
      router.push('/dashboard');
    }
  }, [status, router, session]);
  
  // Fetch users data
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
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
      
      // If it's a driver, validate car data
      if (newUser.role === 'driver') {
        if (!newCar.car_name || !newCar.car_registration) {
          alert('ກະລຸນາກວດສອບຂໍ້ມູນລົດທີ່ຈຳເປັນ');
          setLoading(false);
          return;
        }
      }
      
      // Step 1: Create user
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          phone: newUser.phone || '',
          employeeId: newUser.employeeId || `${newUser.role.charAt(0).toUpperCase()}${Date.now().toString().slice(-6)}`,
        }),
      });
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      const createdUser = await userResponse.json();
      
      // If this is a driver, create the associated car
      if (newUser.role === 'driver') {
        const carId = newCar.car_id || `CAR-${Date.now().toString().slice(-6)}`;
        
        const carResponse = await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            car_id: carId,
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
        employeeId: '',
      });
      
      setNewCar({
        car_id: '',
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
  
  // Function to render users based on active tab
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
    }
    
    if (loading) {
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
      const isDriver = activeTab === 'drivers';
      const driver = user as Driver;
      
      return (
        <div key={user._id} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
          <div className="p-4 flex items-center">
            <div className={`w-12 h-12 ${
              isDriver ? 'bg-blue-100' : 
              activeTab === 'staff' ? 'bg-green-100' : 'bg-purple-100'
            } rounded-full flex items-center justify-center mr-4`}>
              <FiUser size={24} className={`
                ${isDriver ? 'text-blue-500' : 
                  activeTab === 'staff' ? 'text-green-500' : 'text-purple-500'}
              `} />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">{user.name}</div>
              {isDriver && user.employeeId && (
                <div className="text-sm text-gray-500">ID: {user.employeeId}</div>
              )}
            </div>
            <div className="flex items-center space-x-8 mr-4">
              <div className="flex items-center">
                <FiMail size={18} className="text-gray-400 mr-2" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center">
                  <FiPhone size={18} className="text-gray-400 mr-2" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button 
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                onClick={() => router.push(`/dashboard/users/edit/${user._id}`)}
              >
                <FiEdit2 size={18} />
              </button>
              {/* Don't allow deleting administrators if it's the only one */}
              {!(activeTab === 'admin' && admins.length <= 1) && (
                <button 
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                  onClick={() => handleDeleteUser(user._id!, user.role)}
                >
                  <FiTrash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    });
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
                 activeTab === 'staff' ? 'ເພີ່ມພະນັກງານຂາຍປີ້' : 'ເພີ່ມຜູ້ບໍລິຫານລະບົບ'}
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
                
                {activeTab === 'drivers' && (
                  <div>
                    <label className="block text-sm font-bold mb-2">ລະຫັດພະນັກງານ</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-300 rounded p-2"
                      placeholder="DRV001"
                      value={newUser.employeeId || ''}
                      onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                    />
                  </div>
                )}
                
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
  
  // If not authenticated as admin, don't show anything
  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ຈັດການຜູ້ໃຊ້ລະບົບ</h1>
        <NeoButton onClick={() => setShowAddModal(true)}>
          ເພີ່ມຜູ້ໃຊ້ລະບົບ
        </NeoButton>
      </div>
      
      {/* User Directory section */}
      <NeoCard className="overflow-hidden mb-6">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">User Directory</h2>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'drivers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => {
                setActiveTab('drivers');
                setNewUser({...newUser, role: 'driver'});
              }}
            >
              Drivers
            </button>
            <button
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'staff' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => {
                setActiveTab('staff');
                setNewUser({...newUser, role: 'staff'});
              }}
            >
              Ticket Sellers
            </button>
            <button
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'admin' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
              }`}
              onClick={() => {
                setActiveTab('admin');
                setNewUser({...newUser, role: 'admin'});
              }}
            >
              Administrators
            </button>
          </div>
          
          {/* User list */}
          <div>
            {renderUsers()}
          </div>
        </div>
      </NeoCard>
      
      {/* Add user modal */}
      {renderAddUserModal()}
    </div>
  );
}