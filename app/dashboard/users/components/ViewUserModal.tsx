// app/dashboard/users/components/ViewUserModal.tsx - Updated with Car Information
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
  FiTag,
} from 'react-icons/fi';
import { User } from '../types';
import { TfiCar } from 'react-icons/tfi';

// Define Car and CarType interfaces
interface CarType {
  _id: string;
  carType_id: string;
  carType_name: string;
}

interface Car {
  _id: string;
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  car_type_id: string;
  carType?: CarType;
}

interface ViewUserModalProps {
  user: User;
  onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ 
  user,
  onClose
}) => {
  const [assignedCars, setAssignedCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

  // Fetch assigned cars when modal opens (for drivers)
  useEffect(() => {
    if (user.role === 'driver' && user._id) {
      fetchAssignedCars();
    }
  }, [user._id, user.role]);

  const fetchAssignedCars = async () => {
    try {
      setLoadingCars(true);
      const response = await fetch(`/api/cars/by-driver/${user._id}`);
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

  // ฟังก์ชันแสดงฟิลด์ข้อมูล
  const renderField = (label: string, value: string | undefined, icon: React.ReactNode) => {
    if (!value) return null;
    
    return (
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-500 mb-1 flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </div>
        <div className="text-lg pl-6">{value}</div>
      </div>
    );
  };

  // ฟังก์ชันแสดงข้อมูลรถ
  const renderCarSection = () => {
    if (user.role !== 'driver') return null;

    return (
      <div className="col-span-2 mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <TfiCar className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-bold text-gray-800">ຂໍ້ມູນລົດທີ່ຮັບຜິດຊອບ</h3>
          {assignedCars.length > 0 && (
            <span className="ml-3 bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
              {assignedCars.length} ຄັນ
            </span>
          )}
        </div>

        {loadingCars ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">ກຳລັງໂຫລດຂໍ້ມູນລົດ...</span>
          </div>
        ) : assignedCars.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <FiTruck className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-700 font-medium">ຍັງບໍ່ມີລົດມອບໝາຍ</p>
            <p className="text-yellow-600 text-sm mt-1">ກະລຸນາຕິດຕໍ່ຜູ້ບໍລິຫານເພື່ອມອບໝາຍລົດ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedCars.map((car, index) => (
              <div key={car._id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {/* Car Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FiTruck className="text-blue-600 mr-2" size={20} />
                    <h4 className="font-bold text-blue-800 text-lg">{car.car_registration}</h4>
                  </div>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                    {car.car_id}
                  </span>
                </div>

                {/* Car Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-600">ຊື່ລົດ / ຮຸ່ນ</div>
                    <div className="font-medium text-gray-800">{car.car_name}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-600">ຄວາມຈຸ</div>
                    <div className="font-medium text-gray-800">{car.car_capacity} ຄົນ</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-600">ປະເພດລົດ</div>
                    <div className="font-medium text-gray-800">
                      {car.carType ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          {car.carType.carType_name}
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                          ບໍ່ລະບຸ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Car Type ID (if available) */}
                {car.carType && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center text-sm text-blue-600">
                      <FiTag className="mr-1" size={14} />
                      <span>ລະຫັດປະເພດ: {car.carType.carType_id}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 shadow-xl overflow-y-auto max-h-[90vh] animate-fadeIn">
        {/* ส่วนหัว */}
        <div className="bg-blue-500 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">ລາຍລະອຽດຜູ້ໃຊ້</h2>
            <button 
              className="p-1 hover:bg-blue-600 rounded-full transition-colors"
              onClick={onClose}
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ข้อมูลหลัก */}
            <div>
              <div className="flex items-center mb-6">
                {user.userImage ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden mr-4 border-4 border-blue-100 shadow-md">
                    <img 
                      src={user.userImage} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mr-4 border-4 border-blue-100 shadow-md">
                    <FiUser size={40} className="text-blue-500" />
                  </div>
                )}
                
                <div>
                  <h3 className="text-2xl font-bold">{user.name}</h3>
                  <p className="text-sm text-blue-500 bg-blue-50 px-2 py-1 rounded-full inline-block capitalize mb-1">
                    {user.role === 'driver' ? 'ຄົນຂັບລົດ' : 
                     user.role === 'staff' ? 'ພະນັກງານຂາຍປີ້' :
                     user.role === 'admin' ? 'ຜູ້ບໍລິຫານລະບົບ' : 
                     user.role === 'station' ? 'ສະຖານີ' : user.role}
                  </p>
                  {user.employeeId && <p className="text-sm">ID: {user.employeeId}</p>}
                  {user.stationId && <p className="text-sm">ID: {user.stationId}</p>}
                </div>
              </div>
              
              {renderField('ອີເມວ', user.email, <FiMail size={18} className="text-blue-500" />)}
              {renderField('ເບີໂທລະສັບ', user.phone, <FiPhone size={18} className="text-blue-500" />)}
              {renderField('ວັນເດືອນປີເກີດ', user.birthDate, <FiCalendar size={18} className="text-blue-500" />)}
              {renderField('ເລກບັດປະຈຳຕົວ', user.idCardNumber, <FiCreditCard size={18} className="text-blue-500" />)}
              {renderField('ສະຖານທີ່ຕັ້ງ', user.location, <FiMapPin size={18} className="text-blue-500" />)}
            </div>
            
            {/* ข้อมูลเพิ่มเติม */}
            <div>
              {/* ถ้าเป็นคนขับหรือพนักงาน */}
              {(user.role === 'driver' || user.role === 'staff') && (
                <>
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-500 mb-1">ສະຖານະການເຂົ້າວຽກ</div>
                    <div className={`inline-block px-3 py-1 rounded-full font-medium ${
                      user.checkInStatus === 'checked-in' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {user.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກແລ້ວ' : 'ຍັງບໍ່ໄດ້ເຂົ້າວຽກ'}
                    </div>
                  </div>
                  
                  {user.lastCheckIn && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-500 mb-1 flex items-center">
                        <span className="mr-2">🕒</span>
                        ເວລາເຂົ້າວຽກລ່າສຸດ
                      </div>
                      <div className="pl-6">{new Date(user.lastCheckIn).toLocaleString()}</div>
                    </div>
                  )}
                  
                  {user.lastCheckOut && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-500 mb-1 flex items-center">
                        <span className="mr-2">🕒</span>
                        ເວລາອອກວຽກລ່າສຸດ
                      </div>
                      <div className="pl-6">{new Date(user.lastCheckOut).toLocaleString()}</div>
                    </div>
                  )}
                </>
              )}
              
              {/* ถ้าเป็น station แสดงข้อมูลเฉพาะ */}
              {user.role === 'station' && user.stationName && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-500 mb-1">ຊື່ສະຖານີ</div>
                  <div className="text-lg">{user.stationName}</div>
                </div>
              )}
              
              {/* รูปบัตรประชาชน */}
              {user.idCardImage && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-500 mb-1">ຮູບບັດປະຈຳຕົວ</div>
                  <div className="border rounded-lg overflow-hidden mt-2 shadow-md">
                    <img 
                      src={user.idCardImage} 
                      alt="ID Card" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* ส่วนแสดงข้อมูลรถ (เฉพาะคนขับ) */}
          {renderCarSection()}
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;