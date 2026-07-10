import { PropsWithChildren } from 'react'
import '@/styles/main.css'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'textbee.dev - sms gateway - dashboard',

  metadataBase: new URL('https://textbee.dev'),
}

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' suppressHydrationWarning className={inter.variable}>
      <body className='font-sans antialiased'>
        <main>{children}</main>
      </body>
    </html>
  )
}
