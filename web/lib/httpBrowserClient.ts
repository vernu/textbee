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

export default httpBrowserClient
