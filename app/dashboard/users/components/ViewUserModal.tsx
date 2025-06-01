// app/dashboard/users/components/ViewUserModal.tsx - Optimized
import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar,
  FiCreditCard,
  FiX,
  FiTruck,
} from 'react-icons/fi';
import { User } from '../types';
import { TfiCar } from 'react-icons/tfi';

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

interface ViewUserModalProps {
  user: User;
  onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, onClose }) => {
  const [assignedCars, setAssignedCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

  useEffect(() => {
    if (user.role === 'driver' && user._id) {
      fetchAssignedCars();
    }
  }, [user._id, user.role]);

  const fetchAssignedCars = async () => {
    try {
      setLoadingCars(true);
      const response = await fetch(`/api/cars?user_id=${user._id}`);
      if (response.ok) {
        const carsData = await response.json();
        setAssignedCars(carsData);
      }
    } catch (error) {
      console.error('Error fetching assigned cars:', error);
    } finally {
      setLoadingCars(false);
    }
  };

  const renderField = (label: string, value: string | undefined, icon: React.ReactNode) => {
    if (!value) return null;
    return (
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-500 mb-1 flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </div>
        <div className="pl-6">{value}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold">ລາຍລະອຽດຜູ້ໃຊ້</h2>
          <button onClick={onClose} className="p-1 hover:bg-blue-600 rounded-full">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Info */}
            <div>
              <div className="flex items-center mb-4">
                {user.userImage ? (
                  <img src={user.userImage} alt={user.name} 
                       className="w-20 h-20 rounded-full object-cover mr-4 border-4 border-blue-100" />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <FiUser size={32} className="text-blue-500" />
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-bold">{user.name}</h3>
                  <p className="text-sm text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                    {user.role === 'driver' ? 'ຄົນຂັບລົດ' : 
                     user.role === 'staff' ? 'ພະນັກງານ' :
                     user.role === 'admin' ? 'ຜູ້ບໍລິຫານ' : 
                     user.role === 'station' ? 'ສະຖານີ' : user.role}
                  </p>
                  {user.employeeId && <p className="text-sm">ID: {user.employeeId}</p>}
                </div>
              </div>
              
              {renderField('ອີເມວ', user.email, <FiMail size={16} className="text-blue-500" />)}
              {renderField('ເບີໂທ', user.phone, <FiPhone size={16} className="text-blue-500" />)}
              {renderField('ວັນເກີດ', user.birthDate, <FiCalendar size={16} className="text-blue-500" />)}
              {renderField('ເລກບັດ', user.idCardNumber, <FiCreditCard size={16} className="text-blue-500" />)}
              {renderField('ທີ່ຢູ່', user.location, <FiMapPin size={16} className="text-blue-500" />)}
            </div>
            
            {/* Additional Info */}
            <div>
              {(user.role === 'driver' || user.role === 'staff') && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-500 mb-1">ສະຖານະ</div>
                  <div className={`inline-block px-3 py-1 rounded-full font-medium ${
                    user.checkInStatus === 'checked-in' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກແລ້ວ' : 'ຍັງບໍ່ໄດ້ເຂົ້າວຽກ'}
                  </div>
                </div>
              )}
              
              {user.idCardImage && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-500 mb-1">ຮູບບັດ</div>
                  <img src={user.idCardImage} alt="ID Card" className="w-full rounded-lg border" />
                </div>
              )}
            </div>
          </div>
          
          {/* Cars Section - Only for drivers */}
          {user.role === 'driver' && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center mb-4">
                <TfiCar className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-bold">ລົດທີ່ຮັບຜິດຊອບ</h3>
                {assignedCars.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
                    {assignedCars.length}
                  </span>
                )}
              </div>

              {loadingCars ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2">ກຳລັງໂຫລດ...</span>
                </div>
              ) : assignedCars.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-700">ຍັງບໍ່ມີລົດມອບໝາຍ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedCars.map((car) => (
                    <div key={car._id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <FiTruck className="text-blue-600 mr-2" />
                          <h4 className="font-bold text-blue-800">{car.car_registration}</h4>
                        </div>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {car.car_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="font-semibold text-gray-600">ຊື່ລົດ</div>
                          <div>{car.car_name}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-600">ຄວາມຈຸ</div>
                          <div>{car.car_capacity} ຄົນ</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-600">ປະເພດ</div>
                          <div>
                            {car.carType ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {car.carType.carType_name}
                              </span>
                            ) : (
                              <span className="text-gray-500">ບໍ່ລະບຸ</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;