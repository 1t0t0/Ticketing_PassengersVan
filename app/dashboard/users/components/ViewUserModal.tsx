// app/dashboard/users/components/ViewUserModal.tsx - Fixed TypeScript types
import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiMail, FiPhone, FiCalendar, FiCreditCard, FiMapPin, FiClock, FiActivity, FiTruck, FiInfo } from 'react-icons/fi';
import { User } from '../types';
import GoogleAlphabetIcon from '@/components/GoogleAlphabetIcon';

interface Car {
  _id: string;
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  carType?: {
    carType_name: string;
  };
}

interface WorkTimeStats {
  totalWorkDays: number;
  averageWorkHours: number;
  lastCheckIn: string;
  lastCheckOut: string;
  currentStatus: string;
}

interface WorkLog {
  date: string;
  action: 'check-in' | 'check-out';
  timestamp: string;
}

interface ViewUserModalProps {
  user: User;
  onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, onClose }) => {
  const [assignedCars, setAssignedCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState<boolean>(false);
  const [workStats, setWorkStats] = useState<WorkTimeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  useEffect(() => {
    if (user.role === 'driver' && user._id) {
      fetchAssignedCars();
      fetchWorkTimeStats();
    }
    
    if ((user.role === 'staff' || user.role === 'admin') && user._id) {
      fetchWorkTimeStats();
    }
  }, [user._id, user.role]);

  const fetchAssignedCars = async (): Promise<void> => {
    try {
      setLoadingCars(true);
      const response = await fetch(`/api/cars?user_id=${user._id}`);
      if (response.ok) {
        const carsData: Car[] = await response.json();
        setAssignedCars(carsData);
      }
    } catch (error) {
      console.error('Error fetching assigned cars:', error);
    } finally {
      setLoadingCars(false);
    }
  };

  const fetchWorkTimeStats = async (): Promise<void> => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/work-logs/user/${user._id}?limit=30`);
      
      if (response.ok) {
        const workLogs: WorkLog[] = await response.json();
        
        const uniqueDates = new Set(workLogs.map((log: WorkLog) => log.date));
        const totalWorkDays = uniqueDates.size;
        
        let totalHours = 0;
        let daysWithCompleteData = 0;
        
        Array.from(uniqueDates).forEach((date: string) => {
          const dayLogs = workLogs.filter((log: WorkLog) => log.date === date);
          const checkIn = dayLogs.find((log: WorkLog) => log.action === 'check-in');
          const checkOut = dayLogs.find((log: WorkLog) => log.action === 'check-out');
          
          if (checkIn && checkOut) {
            const hours = (new Date(checkOut.timestamp).getTime() - new Date(checkIn.timestamp).getTime()) / (1000 * 60 * 60);
            totalHours += hours;
            daysWithCompleteData++;
          }
        });
        
        const averageHours = daysWithCompleteData > 0 ? totalHours / daysWithCompleteData : 0;
        
        setWorkStats({
          totalWorkDays: totalWorkDays,
          averageWorkHours: Math.round(averageHours * 10) / 10,
          lastCheckIn: user.lastCheckIn ? new Date(user.lastCheckIn).toLocaleString('lo-LA') : 'ບໍ່ມີຂໍ້ມູນ',
          lastCheckOut: user.lastCheckOut ? new Date(user.lastCheckOut).toLocaleString('lo-LA') : 'ບໍ່ມີຂໍ້ມູນ',
          currentStatus: user.checkInStatus === 'checked-in' ? 'ກຳລັງເຮັດວຽກ' : 'ບໍ່ໄດ້ເຮັດວຽກ'
        });
      }
    } catch (error) {
      console.error('Error fetching work time stats:', error);
      setWorkStats({
        totalWorkDays: 0,
        averageWorkHours: 0,
        lastCheckIn: 'ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້',
        lastCheckOut: 'ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້',
        currentStatus: 'ບໍ່ຮູ້ສະຖານະ'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const getRoleText = (): string => {
    switch(user.role) {
      case 'driver': return 'ຄົນຂັບລົດ';
      case 'staff': return 'ພະນັກງານຂາຍປີ້';
      case 'admin': return 'ຜູ້ບໍລິຫານ';
      case 'station': return 'ສະຖານີ';
      default: return user.role;
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    
    try {
      let date: Date;
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString + 'T00:00:00.000Z');
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return '';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return '';
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiUser className="mr-3" size={24} />
              <div>
                <h2 className="text-2xl font-bold">ລາຍລະອຽດຜູ້ໃຊ້</h2>
                <p className="text-blue-100 mt-1">{getRoleText()}</p>
              </div>
            </div>
            <button 
              className="text-white hover:bg-blue-600 rounded-full p-2 transition-colors"
              onClick={onClose}
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-center mb-8 bg-gray-50 p-6 rounded-lg">
            <div className="mr-4 flex-shrink-0">
              {user.userImage ? (
                <img 
                  src={user.userImage} 
                  alt={user.name} 
                  className="w-16 h-16 rounded-full object-cover border-4 border-white"
                />
              ) : (
                <GoogleAlphabetIcon 
                  name={user.name} 
                  size="xxl"
                  className="border-4 border-white"
                />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 truncate">{user.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'driver' ? 'bg-blue-100 text-blue-800' :
                  user.role === 'station' ? 'bg-green-100 text-green-800' :
                  user.role === 'staff' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {getRoleText()}
                </span>
                {user.employeeId && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    ID: {user.employeeId}
                  </span>
                )}
              </div>
              
              {(user.role === 'driver' || user.role === 'staff') && (
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                    user.checkInStatus === 'checked-in' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <FiClock className="mr-1" size={14} />
                    {user.checkInStatus === 'checked-in' ? 'ກຳລັງເຮັດວຽກ' : 'ບໍ່ໄດ້ເຮັດວຽກ'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Main Information Grid */}
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <FiInfo className="mr-2 text-blue-500" />
                ຂໍ້ມູນສ່ວນຕົວ
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center text-gray-600 text-sm">
                    <FiMail className="mr-2" size={16} />
                    <span className="font-medium">ອີເມວ</span>
                  </div>
                  <p className="text-gray-900 break-words text-sm pl-6">{user.email}</p>
                </div>
                
                {user.phone && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiPhone className="mr-2" size={16} />
                      <span className="font-medium">ເບີໂທ</span>
                    </div>
                    <p className="text-gray-900 text-sm pl-6">{user.phone}</p>
                  </div>
                )}
                
                {(user.role === 'staff' || user.role === 'driver' || user.birthDate) && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiCalendar className="mr-2" size={16} />
                      <span className="font-medium">ວັນເກີດ</span>
                    </div>
                    <p className="text-gray-900 text-sm pl-6">
                      {user.birthDate ? formatDate(user.birthDate) : 'ບໍ່ມີຂໍ້ມູນ'}
                    </p>
                  </div>
                )}
                
                {user.idCardNumber && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiCreditCard className="mr-2" size={16} />
                      <span className="font-medium">ເລກບັດປະຊາຊົນ</span>
                    </div>
                    <p className="text-gray-900 text-sm pl-6">{user.idCardNumber}</p>
                  </div>
                )}
                
                {user.location && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiMapPin className="mr-2" size={16} />
                      <span className="font-medium">ທີ່ຢູ່</span>
                    </div>
                    <p className="text-gray-900 text-sm pl-6">{user.location}</p>
                  </div>
                )}

                {user.employeeId && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiUser className="mr-2" size={16} />
                      <span className="font-medium">ລະຫັດພະນັກງານ</span>
                    </div>
                    <p className="text-gray-900 font-mono text-sm pl-6">{user.employeeId}</p>
                  </div>
                )}

                {user.stationId && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiMapPin className="mr-2" size={16} />
                      <span className="font-medium">ລະຫັດສະຖານີ</span>
                    </div>
                    <p className="text-gray-900 font-mono text-sm pl-6">{user.stationId}</p>
                  </div>
                )}

                {user.stationName && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiMapPin className="mr-2" size={16} />
                      <span className="font-medium">ຊື່ສະຖານີ</span>
                    </div>
                    <p className="text-gray-900 text-sm pl-6">{user.stationName}</p>
                  </div>
                )}

                {(user.role === 'driver' || user.role === 'staff') && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiClock className="mr-2" size={16} />
                      <span className="font-medium">ສະຖານະການເຮັດວຽກ</span>
                    </div>
                    <div className="pl-6">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        user.checkInStatus === 'checked-in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.checkInStatus === 'checked-in' ? 'ກຳລັງເຮັດວຽກ' : 'ບໍ່ໄດ້ເຮັດວຽກ'}
                      </span>
                    </div>
                  </div>
                )}

                {user.status && (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <FiActivity className="mr-2" size={16} />
                      <span className="font-medium">ສະຖານະບັນຊີ</span>
                    </div>
                    <div className="pl-6">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status === 'active' ? 'ໃຊ້ງານໄດ້' : 'ຢຸດໃຊ້ງານ'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Work Statistics */}
            {(user.role === 'staff' || user.role === 'admin' || user.role === 'driver') && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiActivity className="mr-2 text-green-500" />
                  ສະຖິຕິການເຮັດວຽກ
                </h4>
                
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">ກຳລັງໂຫລດ...</span>
                  </div>
                ) : workStats ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-600">ສະຖານະປັດຈຸບັນ</span>
                        <span className="text-lg font-bold text-blue-800">{workStats.currentStatus}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-2xl font-bold text-gray-900">{workStats.totalWorkDays}</p>
                        <p className="text-sm text-gray-600">ວັນເຮັດວຽກ</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-2xl font-bold text-gray-900">{workStats.averageWorkHours}</p>
                        <p className="text-sm text-gray-600">ຊົ່ວໂມງເຉລີ່ຍ/ວັນ</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-wrap">
                        <span className="font-medium text-gray-600 mr-2">ເຂົ້າວຽກຄັ້ງສຸດທ້າຍ:</span>
                        <span className="text-gray-900">{workStats.lastCheckIn}</span>
                      </div>
                      <div className="flex flex-wrap">
                        <span className="font-medium text-gray-600 mr-2">ອອກວຽກຄັ້ງສຸດທ້າຍ:</span>
                        <span className="text-gray-900">{workStats.lastCheckOut}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້</p>
                )}
              </div>
            )}

            {/* Car Information for Driver */}
            {user.role === 'driver' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiTruck className="mr-2 text-blue-500" />
                  ຂໍ້ມູນລົດທີ່ມອບໝາຍ
                </h4>
                
                {loadingCars ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">ກຳລັງໂຫລດ...</span>
                  </div>
                ) : assignedCars.length > 0 ? (
                  <div className="space-y-4">
                    {assignedCars.map((car) => (
                      <div key={car._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600">ຊື່ລົດ</span>
                            <p className="text-gray-900">{car.car_name}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">ທະບຽນລົດ</span>
                            <p className="text-gray-900 font-mono">{car.car_registration}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">ຄວາມຈຸ</span>
                            <p className="text-gray-900">{car.car_capacity} ທີ່ນັ່ງ</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">ປະເພດລົດ</span>
                            <p className="text-gray-900">{car.carType?.carType_name || 'ບໍ່ລະບຸ'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">ຍັງບໍ່ມີລົດທີ່ມອບໝາຍ</p>
                )}
              </div>
            )}

            {/* ID Card Image */}
            {user.idCardImage && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiCreditCard className="mr-2 text-gray-500" />
                  ຮູບບັດປະຊາຊົນ
                </h4>
                <div className="flex justify-center">
                  <img 
                    src={user.idCardImage} 
                    alt="ID Card" 
                    className="max-w-full max-h-96 object-contain rounded-lg border"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
            <button
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              onClick={onClose}
            >
              ປິດ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;