// app/dashboard/users/components/ViewUserModal.tsx - Low Quality Version
import React, { useState, useEffect } from 'react';
import { User } from '../types';

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

  const getRoleText = () => {
    switch(user.role) {
      case 'driver': return 'ຄົນຂັບລົດ';
      case 'staff': return 'ພະນັກງານ';
      case 'admin': return 'ຜູ້ບໍລິຫານ';
      case 'station': return 'ສະຖານີ';
      default: return user.role;
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">ລາຍລະອຽດຜູ້ໃຊ້</h2>
            <button 
              className="text-gray-500 hover:text-gray-700 text-xl"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-4">
            {user.userImage ? (
              <img 
                src={user.userImage} 
                alt={user.name} 
                className="w-16 h-16 rounded-full object-cover mr-4 border"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mr-4 text-white font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-blue-600 font-medium">{getRoleText()}</p>
              {user.employeeId && <p className="text-sm text-gray-600">ID: {user.employeeId}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-600">ອີເມວ</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            
            {user.phone && (
              <div>
                <label className="block text-sm font-bold text-gray-600">ເບີໂທ</label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
            )}
            
            {user.birthDate && (
              <div>
                <label className="block text-sm font-bold text-gray-600">ວັນເກີດ</label>
                <p className="text-gray-900">{user.birthDate}</p>
              </div>
            )}
            
            {user.idCardNumber && (
              <div>
                <label className="block text-sm font-bold text-gray-600">ເລກບັດ</label>
                <p className="text-gray-900">{user.idCardNumber}</p>
              </div>
            )}
            
            {user.location && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-600">ທີ່ຢູ່</label>
                <p className="text-gray-900">{user.location}</p>
              </div>
            )}
          </div>
          
          {(user.role === 'driver' || user.role === 'staff') && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-600">ສະຖານະ</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                user.checkInStatus === 'checked-in' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກແລ້ວ' : 'ຍັງບໍ່ໄດ້ເຂົ້າວຽກ'}
              </span>
            </div>
          )}
          
          {user.idCardImage && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-600 mb-2">ຮູບບັດ</label>
              <img 
                src={user.idCardImage} 
                alt="ID Card" 
                className="max-w-full h-auto rounded border"
              />
            </div>
          )}
          
          {user.role === 'driver' && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">ລົດທີ່ຮັບຜິດຊອບ</h4>
              
              {loadingCars ? (
                <p className="text-gray-500">ກຳລັງໂຫລດ...</p>
              ) : assignedCars.length === 0 ? (
                <p className="text-yellow-600 bg-yellow-50 p-3 rounded border">ຍັງບໍ່ມີລົດມອບໝາຍ</p>
              ) : (
                <div className="space-y-3">
                  {assignedCars.map((car) => (
                    <div key={car._id} className="bg-blue-50 p-3 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-blue-800">{car.car_registration}</h5>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          {car.car_id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-bold text-gray-600">ຊື່: </span>
                          <span>{car.car_name}</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-600">ຄວາມຈຸ: </span>
                          <span>{car.car_capacity} ຄົນ</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-600">ປະເພດ: </span>
                          <span>{car.carType?.carType_name || 'ບໍ່ລະບຸ'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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