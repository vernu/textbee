'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type PropsWithChildren } from 'react'
import type { Session } from 'next-auth'

// Client-side provider tree for the app. The QueryClient is created once via
// useState so it is stable across re-renders (previously a new client was
// constructed on every render, throwing away the cache). Session expiry is
// handled globally by a 401 response interceptor in httpBrowserClient, so there
// is no longer a per-navigation whoAmI check here.
export default function Providers({
  session,
  children,
}: PropsWithChildren<{ session: Session | null }>) {
  const [queryClient] = useState(() => new QueryClient())

  // ThemeProvider lives in the root layout (app/theme-provider.tsx) so its
  // pre-paint script is not re-rendered on client navigation.
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}
        >
          {children}
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
