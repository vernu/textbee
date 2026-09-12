// Where a request actually came from.
//
// The API runs behind a reverse proxy, and in the hosted deployment behind a
// CDN in front of that. `req.ip` is therefore the address of the nearest hop
// the app trusts, which for every request is the edge, not the caller. The
// edge forwards the caller's address and its region in its own headers, so
// when the deployment declares that it runs behind one, those headers are the
// better source.
//
// Headers are only as trustworthy as the deployment that sets them, so the
// values here are used to label analytics and to key the rate limiter, never
// for authorisation.

import { isIP } from 'net'

// Regions the edge reports when it cannot place the address: the unknown
// placeholder, and the code used for requests from the Tor network.
const UNPLACED_REGIONS = new Set(['XX', 'T1'])

// IPv6 is recorded at this prefix length. See canonicalAddress.
const IPV6_PREFIX_GROUPS = 4

type HeaderBag = Record<string, string | string[] | undefined> | undefined

export type ClientAddress = {
  ip?: string
  country?: string
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Expands an IPv6 address to its eight groups, or undefined if malformed. */
function expandIpv6(value: string): string[] | undefined {
  let text = value

  // A trailing dotted quad ("::ffff:203.0.113.5") is two groups written in
  // IPv4 notation. Rewrite it so the rest of this function sees only groups.
  const lastColon = text.lastIndexOf(':')
  const tail = text.slice(lastColon + 1)
  if (tail.includes('.')) {
    const octets = tail.split('.').map((part) => Number(part))
    if (octets.length !== 4) return undefined
    if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return undefined
    }
    const high = ((octets[0] << 8) | octets[1]).toString(16)
    const low = ((octets[2] << 8) | octets[3]).toString(16)
    text = `${text.slice(0, lastColon + 1)}${high}:${low}`
  }

  const halves = text.split('::')
  if (halves.length > 2) return undefined

  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []

  let groups: string[]
  if (halves.length === 2) {
    const missing = 8 - head.length - rest.length
    if (missing < 0) return undefined
    groups = [...head, ...Array(missing).fill('0'), ...rest]
  } else {
    if (head.length !== 8) return undefined
    groups = head
  }

  const normalised = groups.map((group) => {
    const parsed = Number.parseInt(group, 16)
    return Number.isNaN(parsed) ? undefined : parsed.toString(16)
  })
  return normalised.some((group) => group === undefined)
    ? undefined
    : (normalised as string[])
}

/**
 * One stable spelling for an address, or nothing when it does not parse.
 *
 * Lower cased, with the interface suffix of a link-local address dropped and
 * an IPv4 caller on a dual-stack socket unwrapped from its ::ffff: form. The
 * address itself is kept whole, which is what ad platforms and support
 * transcripts need.
 */
export function rawAddress(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  // A link-local address carries the interface it arrived on after a %. That
  // is local to the host and not part of the address.
  let text = value.trim().split('%')[0].toLowerCase()
  if (!text) return undefined

  // IPv4 tunnelled through an IPv6 socket, which is how a dual-stack listener
  // reports every IPv4 caller.
  if (text.startsWith('::ffff:') && isIP(text.slice(7)) === 4) {
    text = text.slice(7)
  }

  return isIP(text) ? text : undefined
}

/**
 * The address reduced to one value per caller, for counting distinct origins.
 *
 * IPv4 is kept whole. IPv6 becomes its /64 network, because a mobile carrier
 * hands out a network and the device picks a new interface id within it
 * several times a day. Keeping the full address would count one phone as
 * dozens of different origins.
 */
export function canonicalAddress(value: unknown): string | undefined {
  const text = rawAddress(value)
  if (!text) return undefined
  if (isIP(text) === 4) return text

  const groups = expandIpv6(text)
  if (!groups) return undefined
  return `${groups.slice(0, IPV6_PREFIX_GROUPS).join(':')}::/64`
}

/** A two-letter region code, or nothing when the edge could not place it. */
export function cleanCountry(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const code = value.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return undefined
  return UNPLACED_REGIONS.has(code) ? undefined : code
}

/**
 * The caller's address and region for this request. The address is whole;
 * pass it through canonicalAddress when counting distinct origins.
 *
 * Set TRUSTED_PROXY=cloudflare when the deployment sits behind that edge, so
 * the values come from its headers. Unset, the proxy hop is used and no region
 * is available.
 */
export function resolveClientAddress(req?: {
  ip?: string
  headers?: HeaderBag
}): ClientAddress {
  const fallback = rawAddress(req?.ip)

  if (process.env.TRUSTED_PROXY !== 'cloudflare') {
    return fallback ? { ip: fallback } : {}
  }

  const headers = req?.headers ?? {}
  const ip =
    canonicalAddress(headerValue(headers['cf-connecting-ip'])) ?? fallback
  const country = cleanCountry(headerValue(headers['cf-ipcountry']))

  return {
    ...(ip && { ip }),
    ...(country && { country }),
  }
}
