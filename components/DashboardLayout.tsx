'use client';

import { useSession, signOut } from 'next-auth/react';
import NotionSidebar from './Sidebar';
import NotionButton from './ui/NotionButton';

export default function NotionDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <NotionSidebar />
      
      <div className="md:pl-60 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 bg-white border-b border-[#E9E9E8] h-16">
          <div className="flex justify-between items-center h-full px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-medium text-[#37352F]">Bus Ticket System</h1>
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