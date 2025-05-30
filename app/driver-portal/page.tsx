'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NeoCard from '@/components/ui/NotionCard';
import { 
  FiUser, 
  FiTruck, 
  FiCalendar,
  FiClock
} from 'react-icons/fi';

interface Driver {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  phone?: string;
  checkInStatus: 'checked-in' | 'checked-out';
  lastCheckIn?: Date;
  lastCheckOut?: Date;
}

interface Car {
  _id: string;
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
}

export default function DriverPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [driver, setDriver] = useState<Driver | null>(null);
  const [assignedCars, setAssignedCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบการเข้าสู่ระบบ
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, router, session]);

  // ดึงข้อมูลคนขับและรถที่ได้รับมอบหมาย
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver') {
      fetchDriverData();
    }
  }, [status, session]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลคนขับ
      const driverResponse = await fetch(`/api/users/${session?.user?.id}`);
      if (driverResponse.ok) {
        const driverData = await driverResponse.json();
        setDriver(driverData);
      }

      // ดึงข้อมูลรถที่ได้รับมอบหมาย
      const carsResponse = await fetch(`/api/cars/by-driver/${session?.user?.id}`);
      if (carsResponse.ok) {
        const carsData = await carsResponse.json();
        setAssignedCars(carsData);
      }

    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'driver') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ຍິນດີຕ້ອນຮັບ, {driver?.name}</h1>
          <p className="text-gray-600">ລະບົບສຳລັບຄົນຂັບລົດ</p>
        </div>

        {/* ข้อมูลคนขับ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <NeoCard className="p-6">
            <div className="flex items-center mb-4">
              <FiUser className="text-blue-500 mr-3" size={24} />
              <h2 className="text-xl font-semibold">ຂໍ້ມູນສ່ວນຕົວ</h2>
            </div>
            
            {driver && (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">ຊື່:</span>
                  <p className="font-medium">{driver.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">ລະຫັດພະນັກງານ:</span>
                  <p className="font-medium">{driver.employeeId}</p>
                </div>
                <div>
                  <span className="text-gray-600">ອີເມວ:</span>
                  <p className="font-medium">{driver.email}</p>
                </div>
                {driver.phone && (
                  <div>
                    <span className="text-gray-600">ເບີໂທລະສັບ:</span>
                    <p className="font-medium">{driver.phone}</p>
                  </div>
                )}
              </div>
            )}
          </NeoCard>

          <NeoCard className="p-6">
            <div className="flex items-center mb-4">
              <FiClock className="text-green-500 mr-3" size={24} />
              <h2 className="text-xl font-semibold">ສະຖານະການເຂົ້າວຽກ</h2>
            </div>
            
            {driver && (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">ສະຖານະປັດຈຸບັນ:</span>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ml-2 ${
                    driver.checkInStatus === 'checked-in' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {driver.checkInStatus === 'checked-in' ? 'ເຂົ້າວຽກແລ້ວ' : 'ຍັງບໍ່ໄດ້ເຂົ້າວຽກ'}
                  </div>
                </div>
                
                {driver.lastCheckIn && (
                  <div>
                    <span className="text-gray-600">ເຂົ້າວຽກລ່າສຸດ:</span>
                    <p className="font-medium">{new Date(driver.lastCheckIn).toLocaleString('lo-LA')}</p>
                  </div>
                )}
                
                {driver.lastCheckOut && (
                  <div>
                    <span className="text-gray-600">ອອກວຽກລ່າສຸດ:</span>
                    <p className="font-medium">{new Date(driver.lastCheckOut).toLocaleString('lo-LA')}</p>
                  </div>
                )}
              </div>
            )}
          </NeoCard>
        </div>

        {/* ข้อมูลรถที่ได้รับมอบหมาย */}
        <NeoCard className="p-6">
          <div className="flex items-center mb-4">
            <FiTruck className="text-orange-500 mr-3" size={24} />
            <h2 className="text-xl font-semibold">ລົດທີ່ຮັບຜິດຊອບ</h2>
          </div>

          {assignedCars.length === 0 ? (
            <div className="text-center py-8">
              <FiTruck className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-gray-500">ຍັງບໍ່ມີລົດມອບໝາຍ</p>
              <p className="text-gray-400 text-sm mt-2">ກະລຸນາຕິດຕໍ່ຜູ້ບໍລິຫານເພື່ອຮັບມອບລົດ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedCars.map((car) => (
                <div key={car._id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center mb-3">
                    <FiTruck className="text-blue-500 mr-2" size={20} />
                    <h3 className="font-semibold text-lg">{car.car_registration}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">ລະຫັດລົດ:</span>
                      <span className="ml-2 font-medium">{car.car_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ຊື່ລົດ:</span>
                      <span className="ml-2 font-medium">{car.car_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ຄວາມຈຸ:</span>
                      <span className="ml-2 font-medium">{car.car_capacity} ຄົນ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeoCard>

        {/* ข้อมูลเพิ่มเติม */}
        <NeoCard className="p-6 mt-6">
          <div className="flex items-center mb-4">
            <FiCalendar className="text-purple-500 mr-3" size={24} />
            <h2 className="text-xl font-semibold">ຂໍ້ມູນວັນນີ້</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {new Date().toLocaleDateString('lo-LA')}
              </div>
              <div className="text-sm text-blue-600 mt-1">ວັນທີປັດຈຸບັນ</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {assignedCars.length}
              </div>
              <div className="text-sm text-green-600 mt-1">ລົດທີ່ຮັບຜິດຊອບ</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {driver?.checkInStatus === 'checked-in' ? 'ເຮັດວຽກ' : 'ພັກຜ່ອນ'}
              </div>
              <div className="text-sm text-orange-600 mt-1">ສະຖານະປັດຈຸບັນ</div>
            </div>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}