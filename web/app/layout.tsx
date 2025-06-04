import { PropsWithChildren } from 'react'
import '@/styles/main.css'
import { Metadata } from 'next'
import Footer from '@/components/shared/footer'
import { Toaster } from '@/components/ui/toaster'
import Analytics from '@/components/shared/analytics'
import { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'textbee.dev - sms gateway - dashboard',

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
      </body>
    </html>
  )
}
