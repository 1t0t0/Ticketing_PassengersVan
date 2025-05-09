'use client'

import { SessionProvider } from 'next-auth/react'
import ToastProvider from '@/components/ui/ToastProvider'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

// Component นี้จะปิด toasts ทั้งหมดเมื่อเปลี่ยนหน้า
function NavigationEvents() {
  const pathname = usePathname();
  
  useEffect(() => {
    toast.dismiss(); // ปิด toast ทั้งหมดเมื่อเปลี่ยนหน้า
  }, [pathname]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <NavigationEvents />
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}