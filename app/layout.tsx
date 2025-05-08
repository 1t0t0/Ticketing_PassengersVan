import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Bus Ticket System',
  description: 'Bus ticket management system',
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
      </body>
    </html>
  )
}