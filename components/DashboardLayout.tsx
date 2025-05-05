'use client';

import { useSession, signOut } from 'next-auth/react';
import Sidebar from './Sidebar';
import NeoButton from '@/components/ui/NeoButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-neo-yellow">
      <Sidebar />
      
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 bg-neo-blue border-b-4 border-black h-16">
          <div className="flex justify-between items-center h-full px-4 md:px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-black">BUS TICKET SYSTEM</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="font-bold">WELCOME, {session?.user?.name?.toUpperCase()}</span>
              <NeoButton 
                variant="danger" 
                size="sm" 
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                LOGOUT
              </NeoButton>
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