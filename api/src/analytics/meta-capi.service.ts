import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { createHash } from 'crypto'

// Pinned rather than floating. Meta retires a version roughly every two years,
// and a silently stale one stops reporting conversions mid-campaign.
const GRAPH_API_VERSION = 'v23.0'
const REQUEST_TIMEOUT_MS = 5000

export type MetaUserContext = {
  userId: string
  email?: string
  // Only present when a browser request is the origin. A Polar webhook must not
  // supply Polar's own address, which would poison match quality.
  ip?: string
  userAgent?: string
  fbclid?: string
  fbclidAt?: Date
  fbp?: string
}

export type MetaEvent = {
  name: 'CompleteRegistration' | 'InitiateCheckout' | 'Purchase'
  user: MetaUserContext
  sourcePath?: string
  // Appended to the user id so a retry of the same conversion deduplicates but
  // a genuinely different one does not.
  idSuffix?: string
  customData?: Record<string, unknown>
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name)

  isConfigured(): boolean {
    return Boolean(
      process.env.META_PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN,
    )
  }

  private userData(user: MetaUserContext): Record<string, unknown> {
    const data: Record<string, unknown> = {
      external_id: sha256(user.userId),
    }

    if (user.email) data.em = sha256(user.email.trim().toLowerCase())
    if (user.ip) data.client_ip_address = user.ip
    if (user.userAgent) data.client_user_agent = user.userAgent
    if (user.fbp) data.fbp = user.fbp

    // Meta's documented click-id format: fb.<subdomain index>.<click time in
    // milliseconds>.<fbclid>. The click time came from a browser clock, so it
    // is never allowed to sit in the future.
    if (user.fbclid) {
      const now = Date.now()
      const clickedAt = Math.min(user.fbclidAt?.getTime() ?? now, now)
      data.fbc = `fb.1.${clickedAt}.${user.fbclid}`
    }

    return data
  }

  async send(event: MetaEvent): Promise<void> {
    if (!this.isConfigured()) return

    const eventId = event.idSuffix
      ? `${event.name}:${event.user.userId}:${event.idSuffix}`
      : `${event.name}:${event.user.userId}`

    const body: Record<string, unknown> = {
      data: [
        {
          event_name: event.name,
          // Unix seconds, and Meta rejects anything older than seven days.
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: `${
            process.env.FRONTEND_URL ?? 'https://app.textbee.dev'
          }${event.sourcePath ?? '/'}`,
          user_data: this.userData(event.user),
          ...(event.customData && { custom_data: event.customData }),
        },
      ],
      // In the body, never the query string: the token is a long-lived secret
      // and query strings end up in proxy and error logs.
      access_token: process.env.META_CAPI_ACCESS_TOKEN,
    }

    if (process.env.META_CAPI_TEST_EVENT_CODE) {
      body.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE
    }

    await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.META_PIXEL_ID}/events`,
      body,
      { timeout: REQUEST_TIMEOUT_MS },
    )

    this.logger.log(`Sent ${event.name} to Meta (${eventId})`)
  }
}
