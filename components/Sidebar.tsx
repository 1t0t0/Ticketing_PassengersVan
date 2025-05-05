// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NeoButton from './ui/NeoButton';

// กำหนด menu items สำหรับแต่ละบทบาท
const menuItems = {
  admin: [
    { name: 'DASHBOARD', href: '/dashboard' },
    { name: 'TICKET SALES', href: '/dashboard/tickets' },
    { name: 'DRIVERS', href: '/dashboard/drivers' },
    { name: 'REVENUE', href: '/dashboard/revenue' },
    { name: 'DAILY REPORT', href: '/dashboard/reports/daily' },
    { name: 'SETTINGS', href: '/dashboard/settings' },
  ],
  staff: [
    // staff สามารถเข้าถึงได้เฉพาะ 3 เมนูนี้เท่านั้น
    { name: 'TICKET SALES', href: '/dashboard/tickets' },
    { name: 'DRIVERS', href: '/dashboard/drivers' },
    { name: 'REVENUE', href: '/dashboard/revenue' },
  ],
  driver: [
    { name: 'MY INCOME', href: '/driver-portal' },
  ]
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // เลือก navigation items ตามบทบาทของผู้ใช้
  const navigation = session?.user?.role ? menuItems[session.user.role] || [] : [];

  // สำหรับ staff ถ้าพยายามเข้าถึงหน้าที่ไม่มีสิทธิ์ ให้ redirect ไปที่หน้า tickets
  // นี่เป็นการตรวจสอบเบื้องต้นที่ UI ซึ่งควรมีการตรวจสอบที่ middleware ด้วย
  if (session?.user?.role === 'staff' && 
      pathname !== '/dashboard/tickets' && 
      pathname !== '/dashboard/drivers' && 
      pathname !== '/dashboard/revenue' && 
      pathname.startsWith('/dashboard')) {
    // อาจจะใส่โค้ด redirect ที่นี่ แต่ควรทำที่ middleware มากกว่า
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-neo-blue border-r-4 border-black">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-neo-purple border-b-4 border-black">
          <h1 className="text-white font-black text-xl">BUS TICKET</h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <NeoButton
                    variant={isActive ? 'primary' : 'secondary'}
                    className={`w-full justify-start ${isActive ? 'translate-x-1 translate-y-1 shadow-none' : ''}`}
                  >
                    {item.name}
                  </NeoButton>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}