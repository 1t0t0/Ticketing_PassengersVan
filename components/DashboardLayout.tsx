// components/DashboardLayout.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import NotionSidebar from './Sidebar';
import NotionButton from './ui/NotionButton';
import { usePathname } from 'next/navigation'; // เพิ่มการ import usePathname

export default function NotionDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname(); // ใช้ usePathname สำหรับดึง path ปัจจุบัน
  
  // ฟังก์ชันสำหรับแปลง pathname เป็นชื่อหน้าที่แสดง
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'DASHBOARD';
    if (pathname.includes('/dashboard/tickets') && !pathname.includes('/history')) return 'ອອກປີ້';
    if (pathname.includes('/dashboard/tickets/history')) return 'ຂໍ້ມູນປີ້';
    if (pathname.includes('/dashboard/users')) return 'ຂໍ້ມູນຜູ້ໃຊ້';
    if (pathname.includes('/dashboard/revenue')) return 'ຂໍ້ມູນລາຍຮັບ';
    if (pathname.includes('/driver-portal')) return 'ລາຍໄດ້ຂອງຄົນຂັບລົດ';
    
    return 'Bus Ticket System'; // ค่าเริ่มต้นถ้าไม่ตรงกับเงื่อนไขข้างต้น
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Only include the sidebar once */}
      <NotionSidebar />
      
      <div className="md:pl-60 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 bg-white border-b border-[#E9E9E8] h-16">
          <div className="flex justify-between items-center h-full px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-medium text-[#37352F]">{getPageTitle()}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#6B6B6B]">
                {session?.user?.name}
              </span>
              <NotionButton 
                variant="secondary" 
                size="sm" 
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Logout
              </NotionButton>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}