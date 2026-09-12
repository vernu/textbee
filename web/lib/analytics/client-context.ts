// Registration is proxied through this Next server, so by the time the request
// reaches the API its user agent and address belong to the server, not the
// visitor. These read the real values from the inbound browser request so they
// can be forwarded explicitly.

const MAX_USER_AGENT = 512

type HeaderBag = Record<string, string | string[] | undefined> | undefined

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function clientIpFromHeaders(headers: HeaderBag): string | undefined {
  if (!headers) return undefined

  // The edge network in front of this app names the caller in its own header.
  // The forwarded chain below it has already been rewritten by the host, so
  // its first entry is the edge rather than the visitor.
  const candidate =
    first(headers['cf-connecting-ip'])?.trim() ||
    // x-forwarded-for is a chain, client first, proxies after.
    first(headers['x-forwarded-for'])?.split(',')[0]?.trim() ||
    first(headers['x-real-ip'])?.trim() ||
    undefined

  return candidate || undefined
}

// Reported when the edge cannot place the caller, and for the Tor network.
const UNPLACED_REGIONS = new Set(['XX', 'T1'])

export function clientCountryFromHeaders(
  headers: HeaderBag
): string | undefined {
  if (!headers) return undefined

  // The hosting platform's own header describes the hop it saw, which is the
  // edge, so the edge's header is read first.
  const raw =
    first(headers['cf-ipcountry']) || first(headers['x-vercel-ip-country'])
  const code = raw?.trim().toUpperCase()

  if (!code || !/^[A-Z]{2}$/.test(code)) return undefined
  return UNPLACED_REGIONS.has(code) ? undefined : code
}

export function clientContextFromHeaders(headers: HeaderBag) {
  const userAgent = first(headers?.['user-agent'])?.slice(0, MAX_USER_AGENT)
  const ip = clientIpFromHeaders(headers)
  const country = clientCountryFromHeaders(headers)

  if (!userAgent && !ip && !country) return undefined
  return {
    ...(userAgent && { userAgent }),
    ...(ip && { ip }),
    ...(country && { country }),
  }
}
