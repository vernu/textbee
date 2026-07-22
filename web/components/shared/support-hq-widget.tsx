'use client'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'

export default function SupportHQWidget() {
  const { data: session } = useSession()

  // Depended on as individual strings rather than as `session`: SessionProvider
  // hands back a new object on every refetch, and comparing that by reference
  // tore the widget down and re-injected its script even when nothing about the
  // user had changed, closing any open chat.
  const hasUser = Boolean(session?.user)
  const userId = session?.user?.id ?? ''
  const name = session?.user?.name ?? ''
  const email = session?.user?.email ?? ''
  const phone = session?.user?.phone ?? ''

  useEffect(() => {
    let cancelled = false

    const script = document.createElement('script')
    script.src = 'https://cdn.supporthq.app/widget/latest/supporthq-widget.js'
    script.async = true
    script.onload = () => {
      // The script can finish loading after this effect was cleaned up (the
      // src is cached, so a re-run resolves immediately), and initialising
      // then would leave a widget behind that nothing destroys.
      if (cancelled) return
      // @ts-ignore
      window.SupportHQWidget?.init({
        projectId: process.env.NEXT_PUBLIC_SUPPORT_HQ_PROJECT_ID,
        themeColor: process.env.NEXT_PUBLIC_SUPPORT_HQ_THEME_COLOR ?? '#2563eb',
        ...(hasUser && {
          metadata: { userId, name, email, phone },
        }),
      })
    }
    document.body.appendChild(script)

    return () => {
      cancelled = true
      // @ts-ignore
      window.SupportHQWidget?.destroy()
      // destroy() tears down the widget but leaves this tag behind, so each
      // re-run used to add another one for the life of the page.
      script.remove()
    }
  }, [hasUser, userId, name, email, phone])

  return <></>
}
