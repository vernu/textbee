import Dashboard from './(components)/dashboard-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Dashboard>
      {children}
    </Dashboard>
  )
}
