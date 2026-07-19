import Footer from '@/components/shared/footer'

export default function ContributeLayout({
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
