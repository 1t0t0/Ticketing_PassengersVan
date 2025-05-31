// components/DashboardLayout.tsx - Enhanced with Driver Revenue Menu
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FiHome, 
  FiUsers, 
  FiCreditCard, 
  FiBarChart, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiDollarSign,
  FiTruck,
  FiUser
} from 'react-icons/fi';
import { TbBus } from "react-icons/tb";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    name: 'ໜ້າຫຼັກ',
    href: '/dashboard',
    icon: FiHome,
    roles: ['admin', 'staff', 'station'],
    description: 'ພາບລວມລະບົບ'
  },
  {
    name: 'ອອກປີ້',
    href: '/dashboard/tickets',
    icon: FiCreditCard,
    roles: ['admin', 'staff'],
    description: 'ຂາຍແລະຈັດການປີ້'
  },
  {
    name: 'ປະຫວັດປີ້',
    href: '/dashboard/tickets/history',
    icon: FiBarChart,
    roles: ['admin', 'staff', 'station'],
    description: 'ເບິ່ງປະຫວັດການຂາຍ'
  },
  {
    name: 'ຈັດການຜູ້ໃຊ້',
    href: '/dashboard/users',
    icon: FiUsers,
    roles: ['admin', 'staff'],
    description: 'ຄົນຂັບ, ພະນັກງານ, Admin'
  },
  {
    name: 'ຄົນຂັບລົດ',
    href: '/dashboard/drivers',
    icon: FiTruck,
    roles: ['admin', 'staff'],
    description: 'ຂໍ້ມູນຄົນຂັບແລະລົດ'
  },
  {
    name: 'ລາຍຮັບຄົນຂັບ', // 🆕 เมนูใหม่!
    href: '/dashboard/driver-revenue',
    icon: FiDollarSign,
    roles: ['admin', 'staff'],
    description: 'ລາຍຮັບແລະການແບ່ງເງິນຄົນຂັບ'
  },
  {
    name: 'ລາຍງານລາຍຮັບ',
    href: '/dashboard/revenue',
    icon: FiBarChart,
    roles: ['admin', 'staff', 'station'],
    description: 'ສະຫຼຸບລາຍຮັບທັງໝົດ'
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  const userRole = session?.user?.role;
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole || '')
  );

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
            <span className="text-lg font-bold text-gray-800">Bus Ticket</span>
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
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{session?.user?.name}</p>
              <p className="text-xs text-blue-600 capitalize">
                {userRole === 'admin' ? 'ຜູ້ບໍລິຫານ' : 
                 userRole === 'staff' ? 'ພະນັກງານ' : 
                 userRole === 'station' ? 'ສະຖານີ' : userRole}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon 
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                  }`} 
                />
                <div className="flex-1">
                  <div>{item.name}</div>
                  {item.description && (
                    <div className={`text-xs mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  )}
                </div>
                
                {/* 🆕 New Badge สำหรับเมนูใหม่ */}
                {item.href === '/dashboard/driver-revenue' && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    ໃໝ່
                  </span>
                )}
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
              <span className="font-bold text-gray-800">Bus Ticket</span>
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