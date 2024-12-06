import { PropsWithChildren } from 'react'
import '@/styles/main.css'
import { authOptions } from '@/lib/auth'
import { getServerSession, Session } from 'next-auth'
import AppHeader from '@/components/shared/app-header'
import LayoutWrapper from './layout-wrapper'

export default async function RootLayout({ children }: PropsWithChildren) {
  const session: Session | null = await getServerSession(authOptions as any)

  return (
    <>
      <LayoutWrapper session={session}>
        <AppHeader />
        <main className='min-h-[80vh]'>{children}</main>
      </LayoutWrapper>
    </>
  )
}
