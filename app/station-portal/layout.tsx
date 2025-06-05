// app/station-portal/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FiBarChart,
  FiDollarSign, 
  FiLogOut, 
  FiMenu, 
  FiUser, 
  FiX
} from 'react-icons/fi';
import { TbBusStop } from "react-icons/tb";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}


interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    name: 'ລາຍຮັບ',
    href: '/station-portal',
    icon: FiDollarSign,
    description: 'ເບິ່ງລາຍຮັບຂອງສະຖານີ'
  },
 
];

export default function StationLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userImageError, setUserImageError] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [stationInfo, setStationInfo] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'station') {
      router.push('/dashboard');
    }
  }, [status, router, session]);

  // รีเซ็ต image error เมื่อ user เปลี่ยน
  useEffect(() => {
    setUserImageError(false);
  }, [session?.user?.id]);

  // ดึงข้อมูลรูปภาพผู้ใช้และข้อมูลสถานีจากฐานข้อมูล
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            setUserProfileImage(userData.userImage || null);
            setStationInfo({
              stationName: userData.stationName || userData.name,
              stationId: userData.stationId,
              location: userData.location
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserProfileImage(null);
          setStationInfo(null);
        }
      }
    };

    fetchUserData();
  }, [session?.user?.id]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>ກຳລັງໂຫລດ...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'station') {
    return null;
  }

  const userName = session?.user?.name || 'Station';
  
  // ใช้รูปภาพจากฐานข้อมูลแทน session.user.image
  const userImage = userProfileImage || session?.user?.image;
  
  // ตรวจสอบว่ามีรูปภาพที่ใช้งานได้หรือไม่
  const hasValidUserImage = userImage && 
                           typeof userImage === 'string' && 
                           userImage.trim() !== '' &&
                           (userImage.startsWith('http') || userImage.startsWith('data:')) &&
                           !userImageError;

  const handleUserImageError = () => {
    setUserImageError(true);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <TbBusStop className="h-8 w-8 text-green-600 mr-2" />
            <span className="text-lg font-bold text-gray-800">Station Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Station Info */}
        <div className="p-4 border-b border-gray-200 bg-green-50">
          <div className="flex items-center">
            <div className="mr-3">
              {hasValidUserImage ? (
                <img 
                  src={userImage} 
                  alt={userName} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                  onError={handleUserImageError}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{stationInfo?.stationName || userName}</p>
              <p className="text-xs text-green-600">ສະຖານີ</p>
              {stationInfo?.stationId && (
                <p className="text-xs text-gray-500">ID: {stationInfo.stationId}</p>
              )}
              {stationInfo?.location && (
                <p className="text-xs text-gray-500 truncate" title={stationInfo.location}>
                  📍 {stationInfo.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2">
          {menuItems.map((item) => {
            // ใช้ exact matching เพื่อป้องกันปัญหา nested paths
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon 
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-green-600'
                  }`} 
                />
                <div className="flex-1">
                  <div>{item.name}</div>
                  {item.description && (
                    <div className={`text-xs mt-0.5 ${
                      isActive ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <FiLogOut className="mr-3 h-5 w-5" />
            ອອກຈາກລະບົບ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <TbBusStop className="h-6 w-6 text-green-600 mr-2" />
              <span className="font-bold text-gray-800">Station Portal</span>
            </div>
            <div className="w-6 h-6"></div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}