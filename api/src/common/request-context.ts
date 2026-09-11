// The dashboard proxies registration through its own server, so the request the
// API sees comes from that server rather than from the visitor. The browser's
// user agent and address are therefore forwarded in the body, and these helpers
// decide which value to trust.
//
// Body values are attacker controlled. They are used only to label analytics,
// never for authorisation or rate limiting, and are bounded here so a hostile
// payload cannot grow a document or forge a log line.

const MAX_USER_AGENT = 512
const MAX_IP = 45 // longest IPv6 form, including an embedded IPv4 tail

// Control characters, which would otherwise let a forwarded value inject
// newlines into logs.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g

export type ClientContextInput = {
  userAgent?: unknown
  ip?: unknown
}

export type RequestContext = {
  ip?: string
  userAgent?: string
}

function cleanUserAgent(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.replace(CONTROL_CHARACTERS, '').trim()
  return trimmed ? trimmed.slice(0, MAX_USER_AGENT) : undefined
}

function cleanIp(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_IP) return undefined
  // A shape check rather than a validity check: enough to keep arbitrary text
  // out of the field without reimplementing an address parser.
  return /^[0-9a-fA-F:.]+$/.test(trimmed) ? trimmed : undefined
}

export function resolveRequestContext(
  client: ClientContextInput | undefined,
  req?: { ip?: string; headers?: Record<string, any> },
): RequestContext {
  const forwardedUserAgent = cleanUserAgent(client?.userAgent)
  const forwardedIp = cleanIp(client?.ip)

  return {
    userAgent:
      forwardedUserAgent ?? cleanUserAgent(req?.headers?.['user-agent']),
    ip: forwardedIp ?? cleanIp(req?.ip),
  }
}
