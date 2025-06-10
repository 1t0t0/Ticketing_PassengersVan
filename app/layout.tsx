// app/layout.tsx - เพิ่ม Toaster
import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Passenger Van Ticketing System',
  description: 'Passenger Van Ticketing System at Luang Prabang Railway Station',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="lo">
      <head>
        {/* นำเข้า Phetsarath font เป็น font หลักของระบบ */}
        <link
          href="https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontFamily: 'Phetsarath, sans-serif',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}