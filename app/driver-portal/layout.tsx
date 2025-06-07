// app/driver-portal/layout.tsx - แก้ไขเมนูและเพิ่มเงื่อนไขการใช้งาน
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FiDollarSign, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiLock
} from 'react-icons/fi';
import { TbBus } from "react-icons/tb";
import { Scan } from "lucide-react";
import GoogleAlphabetIcon from '@/components/GoogleAlphabetIcon';
import notificationService from '@/lib/notificationService';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
  requiresCheckIn?: boolean; // ✅ เพิ่มเงื่อนไขการ check-in
}

// ✅ เปลี่ยนลำดับและชื่อเมนู
const menuItems: MenuItem[] = [
  {
    name: 'ສະແກນປີ້', // ✅ เปลี่ยนชื่อจาก "ຈັດການການເດີນທາງ"
    href: '/driver-portal/trip-management',
    icon: Scan, // ✅ เปลี่ยนไอคอน
    description: 'ສະແກນ QR Code ແລະ ນັບຜູ້ໂດຍສານ',
    requiresCheckIn: true // ✅ ต้อง check-in ถึงจะใช้ได้
  },
  {
    name: 'ລາຍຮັບ', // ✅ ย้ายมาข้างล่าง
    href: '/driver-portal',
    icon: FiDollarSign,
    description: 'ເບິ່ງລາຍຮັບຂອງຕົນເອງ',
    requiresCheckIn: false // ✅ ดูได้เสมอ
  }
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userImageError, setUserImageError] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [userCheckInStatus, setUserCheckInStatus] = useState<'checked-in' | 'checked-out'>('checked-out');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'driver') {
      router.push('/dashboard');
    }
  }, [status, router, session]);

  // รีเซ็ต image error เมื่อ user เปลี่ยน
  useEffect(() => {
    setUserImageError(false);
  }, [session?.user?.id]);

  // ดึงข้อมูลรูปภาพผู้ใช้และสถานะ check-in จากฐานข้อมูล
  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            setUserProfileImage(userData.userImage || null);
            setUserCheckInStatus(userData.checkInStatus || 'checked-out');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserProfileImage(null);
          setUserCheckInStatus('checked-out');
        }
      }
    };

    fetchUserData();
  }, [session?.user?.id]);

  // ✅ ตรวจสอบว่าเมนูสามารถใช้งานได้หรือไม่
  const isMenuItemDisabled = (item: MenuItem): boolean => {
    if (!item.requiresCheckIn) return false;
    return userCheckInStatus !== 'checked-in';
  };

  // ✅ Handle click เมนู
  const handleMenuClick = (item: MenuItem, e: React.MouseEvent) => {
    if (isMenuItemDisabled(item)) {
      e.preventDefault();
      notificationService.warning('ກະລຸນາ Check-in ກ່ອນໃຊ້ງານສະແກນປີ້');
      return false;
    }
    setSidebarOpen(false);
    return true;
  };

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

  if (status === 'unauthenticated') {
    return null;
  }

  const userName = session?.user?.name || 'Driver';
  
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
            <TbBus className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-lg font-bold text-gray-800">Driver Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
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
                <GoogleAlphabetIcon 
                  name={userName} 
                  size="xl"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{userName}</p>
              <p className="text-xs text-blue-600">ຄົນຂັບລົດ</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                  userCheckInStatus === 'checked-in' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userCheckInStatus === 'checked-in' ? 'ເຂົ້າວຽກ' : 'ອອກວຽກ'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2">
          {menuItems.map((item) => {
            // ใช้ exact matching เพื่อป้องกันปัญหา nested paths
            const isActive = pathname === item.href;
            const isDisabled = isMenuItemDisabled(item);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : isDisabled
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
                onClick={(e) => handleMenuClick(item, e)}
              >
                <div className="relative">
                  <item.icon 
                    className={`mr-3 h-5 w-5 ${
                      isActive 
                        ? 'text-white' 
                        : isDisabled 
                        ? 'text-gray-400'
                        : 'text-gray-500 group-hover:text-blue-600'
                    }`} 
                  />
                  {/* ✅ แสดงไอคอน lock เมื่อปิดการใช้งาน */}
                  {isDisabled && (
                    <FiLock className="absolute -top-1 -right-1 h-3 w-3 text-red-500 bg-white rounded-full p-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <div>{item.name}</div>
                  {item.description && (
                    <div className={`text-xs mt-0.5 ${
                      isActive 
                        ? 'text-blue-100' 
                        : isDisabled 
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  )}
                  {/* ✅ แสดงข้อความเตือนเมื่อปิดการใช้งาน */}
                  {isDisabled && (
                    <div className="text-xs mt-0.5 text-red-500">
                      ຕ້ອງເຂົ້າວຽກກ່ອນ
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
              <TbBus className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-bold text-gray-800">Driver Portal</span>
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