import { PropsWithChildren } from 'react'
import '@/styles/main.css'
import { authOptions } from '@/lib/auth'
import { getServerSession, Session } from 'next-auth'
import AppHeader from '@/components/shared/app-header'
import Providers from './providers'
import Analytics from '@/components/shared/analytics'
import { Toaster } from '@/components/ui/toaster'
import SupportHQWidget from '@/components/shared/support-hq-widget'

export default async function RootLayout({ children }: PropsWithChildren) {
  const session: Session | null = await getServerSession(authOptions as any)

  return (
    <Providers session={session}>
      <AppHeader session={session} />
      {/* No <Footer /> here: the dashboard's sidebar is fixed-position, so a
          full-width footer at this level gets painted over on its left edge.
          Each section renders the footer inside its own content column. */}
      <main className='min-h-[80vh]'>{children}</main>
      <Analytics user={session?.user} />
      <SupportHQWidget />
      <Toaster />
    </Providers>
  )
}
