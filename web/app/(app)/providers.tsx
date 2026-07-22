'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { SessionProvider, useSession } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type PropsWithChildren } from 'react'
import type { Session } from 'next-auth'
import { setSessionToken } from '@/lib/httpBrowserClient'

// Keeps the API client's token in sync with the session (login, logout, tab
// broadcast). Reads from context only: the provider is seeded with the server
// session, so this never hits /api/auth/session.
function SessionTokenBridge() {
  const { data: session } = useSession()

  useEffect(() => {
    setSessionToken(session?.user?.accessToken ?? null)
  }, [session])

  return null
}

// Client-side provider tree for the app. The QueryClient is created once via
// useState so it is stable across re-renders (previously a new client was
// constructed on every render, throwing away the cache). Session expiry is
// handled globally by a 401 response interceptor in httpBrowserClient, so
// SessionProvider does not refetch on window focus and there is no
// per-navigation whoAmI check here.
export default function Providers({
  session,
  children,
}: PropsWithChildren<{ session: Session | null }>) {
  const [queryClient] = useState(() => {
    // Seeded during the first render, before any child mounts and queries.
    setSessionToken(session?.user?.accessToken ?? null)

    // staleTime 60s: mutations invalidate their keys, so the user's own
    // changes are always instant; only out-of-tab changes can lag a minute.
    // The old defaults (staleTime 0, refetch on focus) refetched every query
    // on every mount and window focus.
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    })
  })

  // ThemeProvider lives in the root layout (app/theme-provider.tsx) so its
  // pre-paint script is not re-rendered on client navigation.
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <SessionTokenBridge />
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
