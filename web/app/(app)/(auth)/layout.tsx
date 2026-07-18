import Footer from '@/components/shared/footer'

// The footer is rendered per-section rather than in (app)/layout.tsx, because
// the dashboard's fixed sidebar would otherwise overlap a full-width footer.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
