import { isEnabled } from './config'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
    clarity?: (...args: any[]) => void
  }
}

// Never pass an email or a user id here. Google's terms forbid sending
// personal identifiers to Analytics.
export function track(event: string, props: Record<string, any> = {}) {
  if (typeof window === 'undefined') return
  if (isEnabled('ga')) window.gtag?.('event', event, props)
}
