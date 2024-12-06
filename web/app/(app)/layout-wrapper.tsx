'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Routes } from '@/config/routes'
import { ThemeProvider } from 'next-themes'

export default function LayoutWrapper({ session, children }) {
  const router = useRouter()
  const pathname = usePathname()

  // log the user out if token has expired
  useEffect(() => {
    if (session && session.user && !pathname.includes(Routes.logout)) {
      httpBrowserClient
        .get(ApiEndpoints.auth.whoAmI())
        .then((response) => {
          // token is still valid
          // TODO: if name has changed, update session
        })
        .catch((error) => {
          if (error.response?.status === 401) {
            // token has expired
            router.push(Routes.logout)
          }
        })
    }
  }, [pathname, router, session])

  const queryClient = new QueryClient()

  return (
    <>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
        <SessionProvider session={session}>
          <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
            >
              {children}
            </GoogleOAuthProvider>
          </QueryClientProvider>
        </SessionProvider>
      </ThemeProvider>
    </>
  )
}
