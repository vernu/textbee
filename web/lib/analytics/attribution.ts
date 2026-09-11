// First-party acquisition attribution. Stores where a visitor came from in a
// cookie on the shared domain so the signup endpoint can record it. Makes no
// external request and is therefore always on, including for self-hosters.

export const ATTRIBUTION_COOKIE = 'tb_attr'
export const ATTRIBUTION_MAX_AGE_DAYS = 90

const MAX_FIELD_LENGTH = 200
const MAX_COOKIE_LENGTH = 3800

export type Touch = {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  ref?: string
  referrer?: string
  landingPath?: string
  fbclid?: string
  gclid?: string
  at?: string
}

// The very first visit, whether or not it carried a source. Kept apart from
// first-touch so a plain direct visit never claims credit from a later
// campaign click; it only records where that person first landed.
export type Entry = {
  landingPath?: string
  at?: string
}

export type Attribution = {
  entry?: Entry
  first?: Touch
  last?: Touch
  fbp?: string
}

const TOUCH_FIELDS: (keyof Touch)[] = [
  'source',
  'medium',
  'campaign',
  'content',
  'term',
  'ref',
  'referrer',
  'landingPath',
  'fbclid',
  'gclid',
  'at',
]

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim().slice(0, MAX_FIELD_LENGTH)
  return trimmed || undefined
}

// Approximates the registrable domain so a hop between textbee.dev and
// app.textbee.dev is not counted as a new acquisition source.
export function isInternalReferrer(
  referrerHost: string,
  currentHost: string
): boolean {
  if (!referrerHost) return true
  if (referrerHost === currentHost) return true
  const tail = (host: string) => host.split('.').slice(-2).join('.')
  return tail(referrerHost) === tail(currentHost)
}

export function buildTouch({
  search,
  referrer,
  pathname,
  hostname,
  now,
}: {
  search: string
  referrer: string
  pathname: string
  hostname: string
  now?: Date
}): Touch {
  const params = new URLSearchParams(search)

  let referrerHost: string | undefined
  if (referrer) {
    try {
      const host = new URL(referrer).hostname
      if (!isInternalReferrer(host, hostname)) referrerHost = host
    } catch {
      referrerHost = undefined
    }
  }

  return {
    source: clean(params.get('utm_source')),
    medium: clean(params.get('utm_medium')),
    campaign: clean(params.get('utm_campaign')),
    content: clean(params.get('utm_content')),
    term: clean(params.get('utm_term')),
    ref: clean(params.get('ref')),
    referrer: clean(referrerHost),
    landingPath: clean(pathname),
    fbclid: clean(params.get('fbclid')),
    gclid: clean(params.get('gclid')),
    at: (now ?? new Date()).toISOString(),
  }
}

// A visit only overwrites last-touch when it actually carries a source. Plain
// internal navigation must not erase the campaign that brought someone here.
export function touchCounts(touch: Touch): boolean {
  return Boolean(
    touch.source ||
      touch.medium ||
      touch.campaign ||
      touch.ref ||
      touch.fbclid ||
      touch.gclid ||
      touch.referrer
  )
}

export function mergeAttribution(
  existing: Attribution | null,
  touch: Touch
): Attribution | null {
  const counts = touchCounts(touch)

  // The entry is written exactly once, on the first visit this browser has
  // ever made, and is never revisited afterwards.
  if (!existing) {
    const entry: Entry = { landingPath: touch.landingPath, at: touch.at }
    return counts ? { entry, first: touch, last: touch } : { entry }
  }
  if (!counts) return existing

  return { ...existing, first: existing.first ?? touch, last: touch }
}

function sanitizeTouch(value: unknown): Touch | undefined {
  if (!value || typeof value !== 'object') return undefined
  const input = value as Record<string, unknown>
  const touch: Touch = {}
  for (const field of TOUCH_FIELDS) {
    const raw = input[field]
    if (typeof raw === 'string') {
      const cleaned = clean(raw)
      if (cleaned) touch[field] = cleaned
    }
  }
  return Object.keys(touch).length ? touch : undefined
}

function sanitizeEntry(value: unknown): Entry | undefined {
  if (!value || typeof value !== 'object') return undefined
  const input = value as Record<string, unknown>
  const entry: Entry = {}
  const landingPath =
    typeof input.landingPath === 'string' ? clean(input.landingPath) : undefined
  const at = typeof input.at === 'string' ? clean(input.at) : undefined
  if (landingPath) entry.landingPath = landingPath
  if (at) entry.at = at
  return Object.keys(entry).length ? entry : undefined
}

export function parseAttribution(raw: string | null): Attribution | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null
    const attribution: Attribution = {}
    const entry = sanitizeEntry(parsed.entry)
    const first = sanitizeTouch(parsed.first)
    const last = sanitizeTouch(parsed.last)
    if (entry) attribution.entry = entry
    if (first) attribution.first = first
    if (last) attribution.last = last
    return attribution.entry || attribution.first || attribution.last
      ? attribution
      : null
  } catch {
    return null
  }
}

// Browsers drop an oversized cookie silently, which would lose attribution
// with no error, so shed data until it fits rather than risk the whole value.
// Last touch goes first, then the entry, and first touch is kept to the end
// because it is the one that decides credit.
export function serializeAttribution(attribution: Attribution): string {
  const fits = (candidate: Attribution) =>
    encodeURIComponent(JSON.stringify(candidate)).length <= MAX_COOKIE_LENGTH

  if (fits(attribution)) return JSON.stringify(attribution)

  const first = attribution.first ?? attribution.last
  const withEntry: Attribution = {
    ...(attribution.entry && { entry: attribution.entry }),
    ...(first && { first }),
  }
  if (fits(withEntry)) return JSON.stringify(withEntry)

  const firstOnly: Attribution = { ...(first && { first }) }
  if (fits(firstOnly)) return JSON.stringify(firstOnly)

  const touch = first ?? {}
  const trimmed: Touch = {}
  for (const field of TOUCH_FIELDS) {
    const value = touch[field]
    if (value) trimmed[field] = value.slice(0, 40)
  }
  return JSON.stringify({ first: trimmed })
}

export function readCookie(name: string, cookieString: string): string | null {
  const match = cookieString.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function buildCookieString(
  value: string,
  {
    domain,
    secure,
    maxAgeDays = ATTRIBUTION_MAX_AGE_DAYS,
  }: { domain?: string; secure: boolean; maxAgeDays?: number }
): string {
  const parts = [
    `${ATTRIBUTION_COOKIE}=${encodeURIComponent(value)}`,
    'path=/',
    `max-age=${maxAgeDays * 24 * 60 * 60}`,
    'SameSite=Lax',
  ]
  if (domain) parts.push(`domain=${domain}`)
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function captureTouch(): Attribution | null {
  if (typeof document === 'undefined') return null

  const touch = buildTouch({
    search: window.location.search,
    referrer: document.referrer,
    pathname: window.location.pathname,
    hostname: window.location.hostname,
  })

  const existing = parseAttribution(
    readCookie(ATTRIBUTION_COOKIE, document.cookie)
  )
  const merged = mergeAttribution(existing, touch)
  if (!merged || merged === existing) return merged

  document.cookie = buildCookieString(serializeAttribution(merged), {
    domain: process.env.NEXT_PUBLIC_ATTRIBUTION_COOKIE_DOMAIN,
    secure: window.location.protocol === 'https:',
  })

  return merged
}

export function readAttribution(): Attribution | null {
  if (typeof document === 'undefined') return null

  const attribution = parseAttribution(
    readCookie(ATTRIBUTION_COOKIE, document.cookie)
  )

  // Read _fbp live rather than copying it at capture time: on an ad click the
  // pixel script has usually not run yet when the capture effect fires.
  const fbp = readCookie('_fbp', document.cookie)
  if (!attribution) return fbp ? { fbp } : null
  return fbp ? { ...attribution, fbp } : attribution
}
