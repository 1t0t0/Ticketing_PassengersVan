'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Menu items สำหรับแต่ละบทบาท
const menuItems = {
  admin: [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Ticket Sales', href: '/dashboard/tickets' },
    { name: 'Drivers', href: '/dashboard/drivers' },
    { name: 'Revenue', href: '/dashboard/revenue' },
    { name: 'Daily Report', href: '/dashboard/reports/daily' },
    { name: 'Settings', href: '/dashboard/settings' },
  ],
  staff: [
    { name: 'Ticket Sales', href: '/dashboard/tickets' },
    { name: 'Drivers', href: '/dashboard/drivers' },
    { name: 'Revenue', href: '/dashboard/revenue' },
  ],
  driver: [
    { name: 'My Income', href: '/driver-portal' },
  ]
};

export default function NotionSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // เลือก navigation items ตามบทบาทของผู้ใช้
  const navigation = session?.user?.role ? menuItems[session.user.role] || [] : [];

  return (
    <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-[#F7F6F3] border-r border-[#E9E9E8] overflow-y-auto">
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-[#E9E9E8]">
          <h1 className="text-[#37352F] font-medium text-base">Bus Ticket System</h1>
        </div>
        <div className="flex-1 flex flex-col pt-5 pb-4 px-3">
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm rounded-sm
                    ${isActive 
                      ? 'bg-[#EFEFEF] text-[#37352F] font-medium' 
                      : 'text-[#6B6B6B] hover:bg-[#EFEFEF]'
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}