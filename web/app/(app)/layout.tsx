import { PropsWithChildren } from 'react'
import '@/styles/main.css'
import { authOptions } from '@/lib/auth'
import { getServerSession, Session } from 'next-auth'
import AppHeader from '@/components/shared/app-header'
import LayoutWrapper from './layout-wrapper'
import Analytics from '@/components/shared/analytics'
import { Toaster } from '@/components/ui/toaster'
import Footer from '@/components/shared/footer'

export default async function RootLayout({ children }: PropsWithChildren) {
  const session: Session | null = await getServerSession(authOptions as any)

  return (
    <>
      <LayoutWrapper session={session}>
        <AppHeader session={session} />
        <main className='min-h-[80vh]'>{children}</main>
        <Analytics user={session?.user} />
        <Footer />
        <Toaster />
      </LayoutWrapper>
    </>
  )
}
