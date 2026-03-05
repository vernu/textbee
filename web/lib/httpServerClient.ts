import axios from 'axios'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Session } from 'next-auth'

// Create a base URL that works in Docker container network if running in a container
// or falls back to the public URL if not in a container
const getServerSideBaseUrl = (): string => {
  
  // Prefer explicit public API base URL if set
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }

  // Detect Kubernetes environment
  if (process.env.KUBERNETES_SERVICE_HOST) {
    console.log("Detected Kubernetes environment")
    return process.env.NEXT_PUBLIC_API_BASE_URL || ''
  }

  // Detect Docker container runtime
  if (process.env.CONTAINER_RUNTIME === 'docker') {
    console.log("Detected Docker container environment")
    return 'http://textbee-api:3001/api/v1'
  }

  // Fallback to empty string if nothing else matches
  return ''
}

export const httpServerClient = axios.create({
  baseURL: getServerSideBaseUrl(),
})

httpServerClient.interceptors.request.use(async (config) => {
  const session: Session | null = await getServerSession(authOptions as any)
  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`
  }
  return config
})
