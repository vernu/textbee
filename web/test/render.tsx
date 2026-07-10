import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { TEST_ACCESS_TOKEN, mockUser } from './fixtures'

export const mockSession: Session = {
  user: {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
    phone: mockUser.phone,
    role: mockUser.role,
    avatar: mockUser.avatar ?? undefined,
    accessToken: TEST_ACCESS_TOKEN,
  },
  expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

// A fresh QueryClient per render with retries disabled so failing queries
// surface immediately instead of retrying during tests.
export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

type ProvidersProps = {
  children: ReactNode
  session?: Session | null
  queryClient?: QueryClient
}

export function TestProviders({
  children,
  session = mockSession,
  queryClient,
}: ProvidersProps) {
  const client = queryClient ?? makeTestQueryClient()
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SessionProvider>
  )
}

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  session?: Session | null
  queryClient?: QueryClient
}

// Custom render that wraps a UI in the app's providers. Use this instead of
// RTL's render for any component that reads the session or react-query.
export function renderWithProviders(
  ui: ReactElement,
  { session, queryClient, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders session={session} queryClient={queryClient}>
        {children}
      </TestProviders>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
