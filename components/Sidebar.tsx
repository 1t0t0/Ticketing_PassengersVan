'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TfiTicket } from "react-icons/tfi";
import { FiCreditCard } from "react-icons/fi";

import { 
  FiHome, 
  FiUsers, 
  FiTruck, 
  FiFileText, 
  FiDatabase,
  FiPieChart
} from 'react-icons/fi';

// Menu items สำหรับแต่ละบทบาท - เพิ่ม Revenue กลับมา
const menuItems = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', exact: true, icon: <FiHome size={18} /> },
    { name: 'ອອກປີ້', href: '/dashboard/tickets', exact: true, icon: <TfiTicket size={18} /> },
    { name: 'ຂໍ້ມູນປີ້', href: '/dashboard/tickets/history', exact: false, icon: <FiFileText size={18} /> }, 
    { name: 'ຂໍ້ມູນຜູ້ໃຊ້', href: '/dashboard/users', exact: false, icon: <FiUsers size={18} /> },
    { name: 'ຂໍ້ມູນລາຍຮັບ', href: '/dashboard/revenue', exact: false, icon: <FiPieChart size={18} /> },
  ],
  staff: [
    { name: 'ອອກປີ້', href: '/dashboard/tickets', exact: true, icon: <FiCreditCard  size={18} /> },
    { name: 'ຂໍ້ມູນປີ້', href: '/dashboard/tickets/history', exact: false, icon: <FiFileText size={18} /> },
    { name: 'ຂໍ້ມູນຜູ້ໃຊ້', href: '/dashboard/users', exact: false, icon: <FiUsers size={18} /> },
    { name: 'ຂໍ້ມູນລາຍຮັບ', href: '/dashboard/revenue', exact: false, icon: <FiPieChart size={18} /> },
  ],
  driver: [
    // Driver ไม่มีเมนูอะไรเลย หรือจะให้เข้าไปดูข้อมูลส่วนตัวได้
  ],
  station: [
    { name: 'Dashboard', href: '/dashboard', exact: true, icon: <FiHome size={18} /> },
    { name: 'ຂໍ້ມູນປີ້', href: '/dashboard/tickets/history', exact: false, icon: <FiFileText size={18} /> },
    { name: 'ຂໍ້ມູນລາຍຮັບ', href: '/dashboard/revenue', exact: false, icon: <FiPieChart size={18} /> },
  ]
};

export default function NotionSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // เลือก navigation items ตามบทบาทของผู้ใช้
  const navigation = session?.user?.role ? menuItems[session.user.role as keyof typeof menuItems] || [] : [];

  // ฟังก์ชันสำหรับตรวจสอบว่าลิงก์ใดกำลัง active
  const isActiveLink = (href: string, exact: boolean) => {
    if (exact) {
      // ตรงกันแบบ exact เท่านั้น
      return pathname === href;
    } else {
      // ตรงกันแบบ prefix
      return pathname.startsWith(href);
    }
  };

  return (
    <div className="hidden md:block md:w-60 md:fixed md:inset-y-0">
      <div className="flex flex-col h-full bg-[#F7F6F3] border-r border-[#E9E9E8]">
        <div className="flex items-center h-16 px-6 border-b border-[#E9E9E8]">
          <div className="flex items-center space-x-2">
            <FiTruck size={20} />
            <h1 className="text-[#37352F] font-medium text-base">Bus Ticket System</h1>
          </div>
        </div>
        <div className="flex-1 pt-5 pb-4 px-3 overflow-y-auto">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const active = isActiveLink(item.href, item.exact);
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`
                    flex items-center w-full px-3 py-2.5 text-sm rounded transition-colors
                    ${active 
                      ? 'bg-[#EFEFEF] text-[#37352F] font-medium' 
                      : 'text-[#6B6B6B] hover:bg-[#EFEFEF]'
                    }
                  `}
                >
                  <span className="mr-2 ">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-[#E9E9E8]">
          <div className="flex items-center px-3 py-2 text-sm text-[#6B6B6B]">
            <FiDatabase size={16} className="mr-2 text-blue-600" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}