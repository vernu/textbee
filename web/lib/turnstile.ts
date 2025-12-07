import { type RefObject, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

let loadTurnstilePromise: Promise<void> | null = null

const createLoadPromise = () =>
  new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile script'))
    document.body.appendChild(script)
  })

const ensureTurnstileScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Turnstile unavailable on server'))
  }
  if (window.turnstile) {
    return Promise.resolve()
  }
  if (loadTurnstilePromise) {
    return loadTurnstilePromise
  }

  const existing = document.getElementById(TURNSTILE_SCRIPT_ID)
  if (existing) {
    const scriptEl = existing as HTMLScriptElement
    loadTurnstilePromise = new Promise<void>((resolve) => {
      scriptEl.addEventListener('load', () => resolve(), { once: true })
      const readyStates = ['loaded', 'complete']
      const state = (scriptEl as any).readyState as string | undefined
      if (state && readyStates.includes(state)) {
        resolve()
      }
    })
    return loadTurnstilePromise
  }

  loadTurnstilePromise = createLoadPromise()
  return loadTurnstilePromise
}

type UseTurnstileOptions = {
  siteKey?: string
  onToken?: (token: string) => void
  onError?: (message: string) => void
  onExpire?: (message: string) => void
}

type UseTurnstileResult = {
  containerRef: RefObject<HTMLDivElement>
  token: string
  error: string | null
  isReady: boolean
}

export const useTurnstile = ({
  siteKey,
  onToken,
  onError,
  onExpire,
}: UseTurnstileOptions): UseTurnstileResult => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const containerEl = containerRef.current
  const onTokenRef = useRef(onToken)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    onTokenRef.current = onToken
    onErrorRef.current = onError
    onExpireRef.current = onExpire
  }, [onToken, onError, onExpire])

  useEffect(() => {
    if (!siteKey) {
      setError('Turnstile site key is not configured')
      onErrorRef.current?.('Turnstile site key is not configured')
      return
    }

    ensureTurnstileScript()
      .then(() => setIsReady(true))
      .catch(() => {
        const message = 'Bot check failed to load. Please retry.'
        setError(message)
        onErrorRef.current?.(message)
      })
  }, [siteKey])

  useEffect(() => {
    if (
      !isReady ||
      !containerEl ||
      !window.turnstile ||
      !siteKey ||
      widgetIdRef.current
    ) {
      return
    }

    // Defensive: clear any existing content to avoid duplicate render in StrictMode.
    containerEl.innerHTML = ''

    widgetIdRef.current = window.turnstile.render(containerEl, {
      sitekey: siteKey,
      callback: (receivedToken) => {
        setToken(receivedToken)
        setError(null)
        onTokenRef.current?.(receivedToken)
      },
      'error-callback': () => {
        setToken('')
        const message = 'Bot verification failed. Please retry.'
        setError(message)
        onErrorRef.current?.(message)
      },
      'expired-callback': () => {
        setToken('')
        const message = 'Bot check expired. Please try again.'
        setError(message)
        onExpireRef.current?.(message)
      },
    })

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [isReady, siteKey, containerEl])

  return {
    containerRef,
    token,
    error,
    isReady,
  }
}

