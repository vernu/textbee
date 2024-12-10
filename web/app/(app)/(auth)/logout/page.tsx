'use client'

import { Routes } from '@/config/routes'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Logout() {
  const session = useSession()
  const router = useRouter()
  useEffect(() => {
    if (session.status === 'authenticated') {
      signOut()
    } else {
      router.push(Routes.login)
    }
  }, [router, session.status])

  return (
    <div className='text-center min-h-screen flex items-center justify-center'>
      Logging out...
    </div>
  )
}
