'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'

export default function SupportHQWidget() {

    const { data: session } = useSession()
    
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://cdn.supporthq.app/widget/latest/supporthq-widget.js'
        script.async = true
        // @ts-ignore
        script.onload = () => window.SupportHQWidget?.init({
          projectId: process.env.NEXT_PUBLIC_SUPPORT_HQ_PROJECT_ID,
          themeColor: process.env.NEXT_PUBLIC_SUPPORT_HQ_THEME_COLOR ?? '#2563eb',
          ...(session?.user && {
            metadata: {
              userId: session.user.id || '',
              name: session.user.name || '',
              email: session.user.email || '',
              phone: session.user.phone || '',
            }
          })
        })
        document.body.appendChild(script)
        // @ts-ignore
        return () => { window.SupportHQWidget?.destroy() }
      }, [session])

  return (
    <></>
  )
}
