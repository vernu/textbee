import axios from 'axios'
import { getSession } from 'next-auth/react'

const httpBrowserClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
})

httpBrowserClient.interceptors.request.use(async (config) => {
  const session: any = await getSession()

  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`
  }
  return config
})

export default httpBrowserClient
