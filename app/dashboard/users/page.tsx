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
  FiCalendar,
  FiCamera,
  FiCreditCard,
  FiTruck
} from 'react-icons/fi';

import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import useConfirmation from '@/hooks/useConfirmation';
import notificationService from '@/lib/notificationService';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Interfaces
interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff' | 'driver' | 'station';
  phone?: string;
  birthDate?: string;
  idCardNumber?: string;
  idCardImage?: string;
  userImage?: string;
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
  car_type: string;
  user_id?: string;
}

interface Driver extends User {
  assignedCar?: Car;
}

// Type definitions
type UserTab = 'drivers' | 'staff' | 'admin' | 'station';

// Constants
const DEFAULT_USER: User = {
  name: '',
  email: '',
  password: '',
  role: 'driver',
  phone: '',
  birthDate: '',
  idCardNumber: '',
  idCardImage: '',
  userImage: ''
};

const DEFAULT_CAR: Car = {
  car_name: '',
  car_capacity: 10,
  car_registration: '',
  car_type: 'van'
};

const CAR_TYPES = [
  { value: 'van', label: 'รถตู้ (Van)' },
  { value: 'minibus', label: 'รถมินิบัส (Minibus)' },
  { value: 'bus', label: 'รถบัส (Bus)' },
  { value: 'sedan', label: 'รถเก๋ง (Sedan)' }
];

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
  
  // State - File uploads
  const [idCardImageFile, setIdCardImageFile] = useState<File | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
      return ['drivers'].includes(tab);
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
      notificationService.error(`ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນຜູ້ໃຊ້: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'user') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'idCard') {
        setIdCardImageFile(e.target.files[0]);
      } else {
        setUserImageFile(e.target.files[0]);
      }
    }
  };
  
  const uploadImage = async (file: File, type: 'idCard' | 'user') => {
    // This is a placeholder for image upload
    // In a real application, you'd implement file upload to a server or cloud storage
    // For now, let's simulate an upload with a 1-second delay
    return new Promise<string>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          // Return a fake URL
          resolve(`https://example.com/images/${type}-${Date.now()}.jpg`);
        }
      }, 100);
    });
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
        if (!newUser.idCardNumber || !newCar.car_name || !newCar.car_registration) {
          notificationService.error('ກະລຸນາກວດສອບຂໍ້ມູນຄົນຂັບລົດແລະລົດທີ່ຈຳເປັນ');
          setLoading(false);
          return;
        }
      } else if (newUser.role === 'staff') {
        if (!newUser.idCardNumber) {
          notificationService.error('ກະລຸນາລະບຸເລກບັດປະຈຳຕົວ');
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
      
      // Upload images if provided
      let idCardImageUrl = '';
      let userImageUrl = '';
      
      if (idCardImageFile) {
        idCardImageUrl = await uploadImage(idCardImageFile, 'idCard');
      }
      
      if (userImageFile) {
        userImageUrl = await uploadImage(userImageFile, 'user');
      }
      
      // Prepare user data
      const userData = prepareUserData(newUser);
      
      // Add image URLs if uploaded
      if (idCardImageUrl) {
        userData.idCardImage = idCardImageUrl;
      }
      
      if (userImageUrl) {
        userData.userImage = userImageUrl;
      }
      
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
      
      // Add success notification
      notificationService.success(`ເພີ່ມຜູ້ໃຊ້ ${newUser.role === 'driver' ? 'ຄົນຂັບລົດ' : 
                                 newUser.role === 'staff' ? 'ພະນັກງານຂາຍປີ້' : 
                                 newUser.role === 'station' ? 'ສະຖານີ' : 'ຜູ້ບໍລິຫານລະບົບ'} ສຳເລັດແລ້ວ`);
      
    } catch (error: any) {
      console.error('Error adding user:', error);
      notificationService.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  const prepareUserData = (user: User) => {
    const userData: any = {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
    };
    
    // Add shared fields
    if (user.phone) userData.phone = user.phone;
    if (user.birthDate) userData.birthDate = user.birthDate;
    if (user.idCardNumber) userData.idCardNumber = user.idCardNumber;
    
    // Add role-specific fields
    if (user.role === 'driver' || user.role === 'staff') {
      userData.status = 'active';
      userData.checkInStatus = 'checked-out';
    } else if (user.role === 'station') {
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
        car_type: newCar.car_type,
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
    setIdCardImageFile(null);
    setUserImageFile(null);
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
      notificationService.success(`${newStatus === 'checked-in' ? 'ເຊັກອິນ' : 'ເຊັກເອົາ'} ສຳເລັດແລ້ວ`);
    } catch (error: any) {
      console.error('Error updating check in status:', error);
      notificationService.error(`Error: ${error.message}`);
    } finally {
      setCheckingInOut(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const handleDeleteUser = async (userId: string, role: string, name: string) => {
    showConfirmation(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ ${name}?`, async () => {
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

  // Tab change handler
  const handleTabChange = (tab: UserTab) => {
    setActiveTab(tab);
    let userRole: 'admin' | 'staff' | 'driver' | 'station' = 'driver';
    if (tab === 'admin') userRole = 'admin';
    if (tab === 'staff') userRole = 'staff';
    if (tab === 'station') userRole = 'station';
    if (tab === 'drivers') userRole = 'driver';
    
    setNewUser(prev => ({...prev, role: userRole}));
  };

  // UI Components
  const renderTabs = () => {
    const allTabs: UserTab[] = ['drivers', 'staff', 'station', 'admin'];
    
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
  
  const renderAddUserModal = () => {
    if (!showAddModal) return null;
    
    const modalTitle = activeTab === 'drivers' ? 'ເພີ່ມຄົນຂັບລົດ' : 
                      activeTab === 'staff' ? 'ເພີ່ມພະນັກງານຂາຍປີ້' : 
                      activeTab === 'station' ? 'ເພີ່ມສະຖານີ' : 'ເພີ່ມຜູ້ບໍລິຫານລະບົບ';
    
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
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
              {/* Common fields for all user types */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-4">ຂໍ້ມູນທົ່ວໄປ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    label="ຊື່ ແລະ ນາມສະກຸນ"
                    type="text"
                    icon={<FiUser />}
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                  
                  {(activeTab === 'drivers' || activeTab === 'staff') && (
                    <FormField 
                      label="ວັນເດືອນປີເກີດ"
                      type="date"
                      icon={<FiCalendar />}
                      value={newUser.birthDate || ''}
                      onChange={(e) => setNewUser({...newUser, birthDate: e.target.value})}
                      required
                    />
                  )}
                  
                  <FormField 
                    label="ອີເມວ"
                    type="email"
                    icon={<FiMail />}
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                  
                  <FormField 
                    label="ເບີໂທລະສັບ"
                    type="tel"
                    icon={<FiPhone />}
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

                  {(activeTab === 'drivers' || activeTab === 'staff') && (
                    <FormField 
                      label="ເລກບັດປະຈຳຕົວ"
                      type="text"
                      icon={<FiCreditCard />}
                      value={newUser.idCardNumber || ''}
                      onChange={(e) => setNewUser({...newUser, idCardNumber: e.target.value})}
                      required
                    />
                  )}

                  {activeTab === 'station' && (
                    <FormField 
                      label="ສະຖານທີ່ຕັ້ງ"
                      type="text"
                      icon={<FiMapPin />}
                      placeholder="ບ້ານ ນາໄຊ, ເມືອງ ຫຼວງພະບາງ"
                      value={(newUser as any).location || ''}
                      onChange={(e) => setNewUser({...newUser, location: e.target.value} as any)}
                      required
                    />
                  )}
                </div>
              </div>
              
              {/* Image upload fields for drivers and staff */}
              {(activeTab === 'drivers' || activeTab === 'staff') && (
                <div className="mb-6 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-lg mb-4">ຮູບພາບ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">ຮູບບັດປະຈຳຕົວ</label>
                      <div className="flex items-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="idCardImage"
                          onChange={(e) => handleFileChange(e, 'idCard')}
                        />
                        <label
                          htmlFor="idCardImage"
                          className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
                        >
                          {idCardImageFile ? (
                            <div className="text-center">
                              <FiCamera className="mx-auto text-2xl text-green-500" />
                              <p className="text-sm mt-1">{idCardImageFile.name}</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FiCamera className="mx-auto text-2xl text-gray-400" />
                              <p className="text-sm mt-1">ອັບໂຫລດຮູບບັດປະຈຳຕົວ</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold mb-2">ຮູບຖ່າຍ</label>
                      <div className="flex items-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="userImage"
                          onChange={(e) => handleFileChange(e, 'user')}
                        />
                        <label
                          htmlFor="userImage"
                          className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
                        >
                          {userImageFile ? (
                            <div className="text-center">
                              <FiCamera className="mx-auto text-2xl text-green-500" />
                              <p className="text-sm mt-1">{userImageFile.name}</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FiCamera className="mx-auto text-2xl text-gray-400" />
                              <p className="text-sm mt-1">ອັບໂຫລດຮູບຖ່າຍ</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload progress bar */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">ອັບໂຫລດ: {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Car information for drivers */}
              {activeTab === 'drivers' && (
                <div className="mb-6 border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-lg mb-4">ຂໍ້ມູນລົດ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField 
                      label="ຊື່ລົດ"
                      type="text"
                      icon={<FiTruck />}
                      placeholder="Toyota Hiace"
                      value={newCar.car_name}
                      onChange={(e) => setNewCar({...newCar, car_name: e.target.value})}
                      required
                    />
                    
                    <FormField 
                      label="ທະບຽນລົດ"
                      type="text"
                      placeholder="12ກຂ 3456"
                      value={newCar.car_registration}
                      onChange={(e) => setNewCar({...newCar, car_registration: e.target.value})}
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

                    <div>
                      <label className="block text-sm font-bold mb-2">ປະເພດລົດ</label>
                      <select 
                        className="w-full border-2 border-gray-300 rounded p-2"
                        value={newCar.car_type}
                        onChange={(e) => setNewCar({...newCar, car_type: e.target.value})}
                        required
                      >
                        {CAR_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
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
  
  const renderUsers = () => {
    // Get appropriate user list based on active tab
    const getUsersForTab = (): { users: User[], userType: string } => {
      switch (activeTab) {
        case 'drivers': return { users: drivers, userType: 'ຄົນຂັບລົດ' };
        case 'staff': return { users: ticketSellers, userType: 'ພະນັກງານຂາຍປີ້' };
        case 'admin': return { users: admins, userType: 'ຜູ້ບໍລິຫານລະບົບ' };
        case 'station': return { users: stations, userType: 'ສະຖານີ' };
      }
    };
    
    const { users, userType } = getUsersForTab();
    
    // Show loading state
    if (loading) {
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
  icon?: React.ReactNode;
}

function FormField({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  required, 
  min,
  icon
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={`w-full border-2 border-gray-300 rounded p-2 ${icon ? 'pl-10' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
        />
      </div>
    </div>
  );
}

interface UserCardProps {
  user: User;
  admins: User[];
  onCheckInOut: (userId: string, currentStatus: string) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string, role: string, name: string) => void;
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
          {user.userImage ? (
            <img 
              src={user.userImage} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <FiUser size={24} className={text} />
          )}
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
          
          {isDriver && (user as Driver).assignedCar && (
            <div className="flex items-center m-2">
              <FiTruck size={18} className="text-gray-400 mr-2" />
              <span>
                {(user as Driver).assignedCar?.car_registration} 
                ({(user as Driver).assignedCar?.car_name})
              </span>
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
                onClick={() => onDelete(user._id!, user.role, user.name)}
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