import Footer from '@/components/shared/footer'

// A layout rather than an edit to the page: checkout renders several different
// branches (confirming, processing, done) and each would otherwise need its
// own footer.
export default function CheckoutLayout({
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
