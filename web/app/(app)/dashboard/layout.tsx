import { JoinCommunityModal } from '@/components/shared/join-community-modal'
import { ContributeModal } from '@/components/shared/contribute-modal'
import Dashboard from './(components)/dashboard-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Dashboard>
      {children}
      <JoinCommunityModal />
      <ContributeModal />
    </Dashboard>
  )
}
