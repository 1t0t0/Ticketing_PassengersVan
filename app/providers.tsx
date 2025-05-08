'use client'

import { SessionProvider } from 'next-auth/react'
import PhetsarathFont from '@/components/ui/PhetsarathFont'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PhetsarathFont />
      {children}
    </SessionProvider>
  )
}