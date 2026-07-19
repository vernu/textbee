import axios from 'axios'
import { getSession } from 'next-auth/react'

const httpBrowserClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
})

// Cache for session data to reduce API calls
let sessionCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

const getCachedSession = async () => {
  const now = Date.now()
  
  // Return cached session if it's still valid
  if (sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return sessionCache
  }
  
  // Fetch fresh session and update cache
  const session = await getSession()
  sessionCache = session
  cacheTimestamp = now
  
  return session
}

httpBrowserClient.interceptors.request.use(async (config) => {
  const session = await getCachedSession()

  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`
  }
  return config
})

// Global session-expiry handling: any 401 from the API means the stored token
// is no longer valid, so send the user to logout. This replaces the previous
// per-navigation whoAmI check in the layout wrapper.
httpBrowserClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error?.response?.status === 401
    ) {
      const { pathname } = window.location
      if (!pathname.includes('/logout') && !pathname.includes('/login')) {
        sessionCache = null
        window.location.href = '/logout'
      }
    }
    return Promise.reject(error)
  }
)

export default httpBrowserClient
