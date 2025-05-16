// สร้างไฟล์ใหม่ที่ app/dashboard/users/components/ViewUserModal.tsx

import React from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar,
  FiCreditCard 
} from 'react-icons/fi';
import { User } from '../types';

interface ViewUserModalProps {
  user: User;
  onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ 
  user,
  onClose
}) => {
  // ฟังก์ชันแสดงฟิลด์ข้อมูล
  const renderField = (label: string, value: string | undefined, icon: React.ReactNode) => {
    if (!value) return null;
    
    return (
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-500 mb-1 flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </div>
        <div className="text-lg">{value}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">ລາຍລະອຽດຜູ້ໃຊ້</h2>
            <button 
              className="text-gray-500 hover:text-gray-700 text-xl"
              onClick={onClose}
            >
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ข้อมูลหลัก */}
            <div>
              <div className="flex items-center mb-4">
                {user.userImage ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden mr-4">
                    <img 
                      src={user.userImage} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <FiUser size={32} className="text-blue-500" />
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-bold">{user.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                  {user.employeeId && <p className="text-sm">ID: {user.employeeId}</p>}
                  {user.stationId && <p className="text-sm">ID: {user.stationId}</p>}
                </div>
              </div>
              
              {renderField('ອີເມວ', user.email, <FiMail size={16} />)}
              {renderField('ເບີໂທລະສັບ', user.phone, <FiPhone size={16} />)}
              {renderField('ວັນເດືອນປີເກີດ', user.birthDate, <FiCalendar size={16} />)}
              {renderField('ເລກບັດປະຈຳຕົວ', user.idCardNumber, <FiCreditCard size={16} />)}
              {renderField('ສະຖານທີ່ຕັ້ງ', user.location, <FiMapPin size={16} />)}
            </div>
            
            {/* ข้อมูลเพิ่มเติม */}
            <div>
              {/* ถ้าเป็นคนขับหรือพนักงาน */}
              {(user.role === 'driver' || user.role === 'staff') && (
                <>
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-500 mb-1">ສະຖານະການເຂົ້າວຽກ</div>
                    <div className={`inline-block px-3 py-1 rounded-full ${
                      user.checkInStatus === 'checked-in' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກແລ້ວ' : 'ຍັງບໍ່ໄດ້ເຂົ້າວຽກ'}
                    </div>
                  </div>
                  
                  {user.lastCheckIn && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-500 mb-1">ເວລາເຂົ້າວຽກລ່າສຸດ</div>
                      <div>{new Date(user.lastCheckIn).toLocaleString()}</div>
                    </div>
                  )}
                  
                  {user.lastCheckOut && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-500 mb-1">ເວລາອອກວຽກລ່າສຸດ</div>
                      <div>{new Date(user.lastCheckOut).toLocaleString()}</div>
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
                  <div className="border rounded-lg overflow-hidden mt-2">
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
          
          <div className="mt-6 flex justify-end">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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