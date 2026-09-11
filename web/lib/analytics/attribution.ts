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

export type Attribution = {
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

  if (!existing) {
    return counts ? { first: touch, last: touch } : null
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

export function parseAttribution(raw: string | null): Attribution | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null
    const attribution: Attribution = {}
    const first = sanitizeTouch(parsed.first)
    const last = sanitizeTouch(parsed.last)
    if (first) attribution.first = first
    if (last) attribution.last = last
    return attribution.first || attribution.last ? attribution : null
  } catch {
    return null
  }
}

// Browsers drop an oversized cookie silently, which would lose attribution
// with no error, so shed data until it fits rather than risk the whole value.
export function serializeAttribution(attribution: Attribution): string {
  let candidate: Attribution = attribution
  let encoded = encodeURIComponent(JSON.stringify(candidate))
  if (encoded.length <= MAX_COOKIE_LENGTH) return JSON.stringify(candidate)

  candidate = { first: attribution.first ?? attribution.last }
  encoded = encodeURIComponent(JSON.stringify(candidate))
  if (encoded.length <= MAX_COOKIE_LENGTH) return JSON.stringify(candidate)

  const touch = candidate.first ?? {}
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
