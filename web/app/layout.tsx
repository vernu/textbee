import { PropsWithChildren } from 'react'
import '@/styles/main.css'
import { Metadata } from 'next'
import CustomerSupport from '@/components/shared/customer-support'
import Footer from '@/components/shared/footer'
import { Toaster } from '@/components/ui/toaster'
import Analytics from '@/components/shared/analytics'
import { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { headers } from 'next/dist/client/components/headers'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'textbee.dev - Free and Open-Source SMS Gateway',
  description:
    'TextBee is an open-source solution that turns your Android device into a powerful SMS gateway. Send SMS effortlessly through your applications.',
  authors: [
    { name: 'Israel Abebe Kokiso', url: 'https://israelabebe.com' },
    { name: 'vernu.dev', url: 'https://vernu.dev' },
  ],
  applicationName: 'textbee.dev',
  keywords: [
    'textbee',
    'sms gateway',
    'open-source',
    'android',
    'sms',
    'gateway',
    'oss',
    'free',
    'opensource',
    'foss',
    'freeware',
    'react',
    'nextjs',
    'tailwindcss',
    'shadcn',
    'typescript',
    'nodejs',
    'express',
    'next-auth',
    'vercel',
    'nestjs',
  ],
  creator: 'Israel Abebe Kokiso',
  publisher: 'vernu.dev',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://textbee.dev',
  },
  openGraph: {
    title: 'textbee.dev - Free and Open-Source SMS Gateway',
    description:
      'TextBee is an open-source solution that turns your Android device into a powerful SMS gateway. Send SMS effortlessly through your applications.',
  },
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://textbee.dev'),
}

export default async function RootLayout({ children }: PropsWithChildren) {
  const session: Session | null = await getServerSession(authOptions as any)
  return (
    <html lang='en'>
      <body>
        <main>{children}</main>
        <Analytics user={session?.user} />
        <Footer />
        <Toaster />
        <CustomerSupport />
      </body>
    </html>
  )
}
