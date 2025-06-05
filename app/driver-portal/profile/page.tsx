// app/driver-portal/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiCreditCard,
  FiEdit3,
  FiSave,
  FiX,
  FiTruck,
  FiCamera
} from 'react-icons/fi';
import GoogleAlphabetIcon from '@/components/GoogleAlphabetIcon';
import notificationService from '@/lib/notificationService';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  idCardNumber?: string;
  idCardImage?: string;
  userImage?: string;
  employeeId?: string;
  checkInStatus?: 'checked-in' | 'checked-out';
  lastCheckIn?: string;
  lastCheckOut?: string;
}

interface CarInfo {
  _id: string;
  car_id: string;
  car_name: string;
  car_capacity: number;
  car_registration: string;
  carType?: {
    carType_name: string;
  };
}

export default function DriverProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [carInfo, setCarInfo] = useState<CarInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState({
    userImage: false,
    idCardImage: false
  });
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthDate: ''
  });

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (session?.user?.id) {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            birthDate: data.birthDate ? data.birthDate.split('T')[0] : ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      notificationService.error('ບໍ່ສາມາດໂຫລດຂໍ້ມູນໄດ້');
    } finally {
      setLoading(false);
    }
  };

  // Fetch car info
  const fetchCarInfo = async () => {
    try {
      if (session?.user?.id) {
        const response = await fetch(`/api/cars/by-driver/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCarInfo(data);
        }
      }
    } catch (error) {
      console.error('Error fetching car info:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'driver' && session?.user?.id) {
      fetchProfile();
      fetchCarInfo();
    }
  }, [status, session]);

  // Handle form input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProfile(); // Refresh profile data
        setEditing(false);
        notificationService.success('ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      notificationService.error(`ເກີດຂໍ້ຜິດພາດ: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditing(false);
    // Reset form data
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : ''
      });
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'ບໍ່ມີຂໍ້ມູນ';
    try {
      return new Date(dateString).toLocaleDateString('lo-LA');
    } catch {
      return 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ';
    }
  };

  // Handle image error
  const handleImageError = (type: 'userImage' | 'idCardImage') => {
    setImageError(prev => ({ ...prev, [type]: true }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'driver' || !profile) {
    return null;
  }

  const hasValidUserImage = profile.userImage && 
                           !imageError.userImage &&
                           (profile.userImage.startsWith('http') || profile.userImage.startsWith('data:'));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ຂໍ້ມູນສ່ວນຕົວ</h1>
              <p className="text-gray-600">ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວຂອງຕົນເອງ</p>
            </div>
            <div className="flex space-x-3">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FiEdit3 className="mr-2" size={16} />
                  ແກ້ໄຂ
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <FiX className="mr-2" size={16} />
                    ຍົກເລີກ
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <FiSave className="mr-2" size={16} />
                    )}
                    ບັນທຶກ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="mx-auto mb-4">
                  {hasValidUserImage ? (
                    <img 
                      src={profile.userImage} 
                      alt={profile.name} 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                      onError={() => handleImageError('userImage')}
                    />
                  ) : (
                    <GoogleAlphabetIcon 
                      name={profile.name} 
                      size="xxxl"
                      className="mx-auto border-4 border-white shadow-lg"
                    />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-600">ຄົນຂັບລົດ</p>
                <p className="text-sm text-gray-500 mt-1">ID: {profile.employeeId}</p>
                
                {/* Status Badge */}
                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                    profile.checkInStatus === 'checked-in' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.checkInStatus === 'checked-in' ? 'ກຳລັງເຮັດວຽກ' : 'ບໍ່ໄດ້ເຮັດວຽກ'}
                  </span>
                </div>

                {/* Last Check-in/out */}
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  {profile.lastCheckIn && (
                    <p>ເຂົ້າວຽກຄັ້ງສຸດທ້າຍ: {formatDate(profile.lastCheckIn)}</p>
                  )}
                  {profile.lastCheckOut && (
                    <p>ອອກວຽກຄັ້ງສຸດທ້າຍ: {formatDate(profile.lastCheckOut)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiUser className="mr-2 text-blue-500" />
                  ຂໍ້ມູນສ່ວນຕົວ
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ຊື່ ແລະ ນາມສະກຸນ</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ອີເມວ</label>
                  <div className="flex items-center">
                    <FiMail className="mr-2 text-gray-400" />
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ອີເມວບໍ່ສາມາດແກ້ໄຂໄດ້</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ເບີໂທລະສັບ</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="ກະລຸນາໃສ່ເບີໂທລະສັບ"
                    />
                  ) : (
                    <div className="flex items-center">
                      <FiPhone className="mr-2 text-gray-400" />
                      <p className="text-gray-900">{profile.phone || 'ບໍ່ມີຂໍ້ມູນ'}</p>
                    </div>
                  )}
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ວັນເດືອນປີເກີດ</label>
                  {editing ? (
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 text-gray-400" />
                      <p className="text-gray-900">{formatDate(profile.birthDate)}</p>
                    </div>
                  )}
                </div>

                {/* ID Card Number (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ເລກບັດປະຈຳຕົວ</label>
                  <div className="flex items-center">
                    <FiCreditCard className="mr-2 text-gray-400" />
                    <p className="text-gray-900">{profile.idCardNumber || 'ບໍ່ມີຂໍ້ມູນ'}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">ຕິດຕໍ່ຜູ້ບໍລິຫານເພື່ອແກ້ໄຂ</p>
                </div>
              </div>
            </div>

            {/* Car Information */}
            {carInfo.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiTruck className="mr-2 text-green-500" />
                    ຂໍ້ມູນລົດທີ່ຮັບຜິດຊອບ
                  </h3>
                </div>
                <div className="p-6">
                  {carInfo.map((car, index) => (
                    <div key={car._id} className={`${index > 0 ? 'border-t border-gray-200 pt-4 mt-4' : ''}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ຊື່ລົດ / ຮຸ່ນ</label>
                          <p className="text-gray-900">{car.car_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ທະບຽນລົດ</label>
                          <p className="text-gray-900 font-mono">{car.car_registration}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ປະເພດລົດ</label>
                          <p className="text-gray-900">{car.carType?.carType_name || 'ບໍ່ລະບຸ'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ຄວາມຈຸ</label>
                          <p className="text-gray-900">{car.car_capacity} ທີ່ນັ່ງ</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ID Card Image */}
            {profile.idCardImage && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiCamera className="mr-2 text-purple-500" />
                    ຮູບບັດປະຈຳຕົວ
                  </h3>
                </div>
                <div className="p-6">
                  {!imageError.idCardImage ? (
                    <img 
                      src={profile.idCardImage} 
                      alt="ID Card" 
                      className="max-w-full max-h-64 object-contain rounded-lg border mx-auto"
                      onError={() => handleImageError('idCardImage')}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <FiCamera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">ບໍ່ສາມາດແສດງຮູບໄດ້</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiUser className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-900">ຂໍ້ສັງເກດ</h3>
          </div>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>• ຂໍ້ມູນທີ່ສາມາດແກ້ໄຂໄດ້ດ້ວຍຕົນເອງ: ຊື່, ເບີໂທ, ວັນເກີດ</p>
            <p>• ຂໍ້ມູນທີ່ຕ້ອງຕິດຕໍ່ຜູ້ບໍລິຫານ: ອີເມວ, ເລກບັດປະຈຳຕົວ, ຮູບພາບ</p>
            <p>• ຂໍ້ມູນລົດຈະຖືກຈັດການໂດຍຜູ້ບໍລິຫານເທົ່ານັ້ນ</p>
            <p>• ຫາກມີຂໍ້ມູນຜິດພາດ ກະລຸນາຕິດຕໍ່ຜູ້ບໍລິຫານເພື່ອແກ້ໄຂ</p>
          </div>
        </div>
      </div>
    </div>
  );
}