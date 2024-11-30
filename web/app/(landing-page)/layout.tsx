import { PropsWithChildren } from 'react'
import LandingPageHeader from './(components)/landing-page-header'

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <LandingPageHeader />
      {children}
    </>
  )
}
