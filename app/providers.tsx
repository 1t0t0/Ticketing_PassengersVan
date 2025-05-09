'use client'

import { SessionProvider } from 'next-auth/react'
import PhetsarathFont from '@/components/ui/PhetsarathFont'
import ToastProvider from '@/components/ui/ToastProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PhetsarathFont />
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}