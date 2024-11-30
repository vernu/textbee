'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function Logout() {
  useEffect(() => {
    signOut()
  }, [])

  return (
    <div className='text-center min-h-screen flex items-center justify-center'>
      Logging out...
    </div>
  )
}
