// Turns the raw attribution blob the browser sends into the fields an
// acquisition report reads. Pure and defensive: the payload is attacker
// controlled and the API has no global ValidationPipe, so this is the only gate
// between the request body and the database.

export type AttributionTouchInput = {
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
  at?: string | Date
}

// The very first visit, whether or not it carried a source. Kept apart from
// first-touch so a plain direct visit never claims credit from a later
// campaign click.
export type AttributionEntryInput = {
  landingPath?: string
  at?: Date
}

export type AttributionInput = {
  entry?: AttributionEntryInput
  first?: AttributionTouchInput
  last?: AttributionTouchInput
  fbp?: string
  capturedAt?: Date
}

const TOUCH_STRING_FIELDS = [
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
] as const

const MAX_FIELD_LENGTH = 200
const MAX_KEYS = 20

// A browser clock is not trusted for the visit time. Slightly ahead is
// ordinary skew; far ahead or absurdly old is a fiction and is dropped.
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000
const MAX_TOUCH_AGE_MS = 400 * 24 * 60 * 60 * 1000

// Android in-app browsers report the referrer as android-app://<package>/,
// so the "host" that reaches here is a package name. Without this table an
// Instagram tap shows up as com.instagram.android rather than meta.
const APP_REFERRERS: Record<string, string> = {
  'com.instagram.android': 'meta',
  'com.facebook.katana': 'meta',
  'com.facebook.lite': 'meta',
  'com.facebook.orca': 'meta',
  'com.twitter.android': 'x',
  'com.reddit.frontpage': 'reddit',
  'com.linkedin.android': 'linkedin',
  'org.telegram.messenger': 'telegram',
  'org.telegram.plus': 'telegram',
  'com.whatsapp': 'whatsapp',
  'com.discord': 'discord',
  'com.slack': 'slack',
  'com.microsoft.teams': 'teams',
  'com.google.android.gm': 'gmail',
  'com.google.android.googlequicksearchbox': 'google',
}

// Referrer hosts worth naming. Anything unlisted falls through to its bare
// hostname, which keeps a new channel visible in reports without a code change.
// Order matters. Several entries sit on a search engine's domain and must
// precede its catch-all rule: gemini.google.com would otherwise be counted as
// Google search, and mail.google.com would turn every Gmail link into an
// organic search visit.
const REFERRER_SOURCES: Array<[RegExp, string]> = [
  [/(^|\.)chatgpt\.com$/, 'chatgpt'],
  [/(^|\.)openai\.com$/, 'chatgpt'],
  [/(^|\.)gemini\.google\.com$/, 'gemini'],
  [/(^|\.)aistudio\.google\.com$/, 'gemini'],
  [/(^|\.)claude\.ai$/, 'claude'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
  [/(^|\.)meta\.ai$/, 'meta-ai'],
  [/(^|\.)(facebook|instagram)\.com$/, 'meta'],
  [/(^|\.)messenger\.com$/, 'meta'],
  [/^mail\.google\.com$/, 'gmail'],
  [/^news\.google\.com$/, 'google-news'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)ecosia\.org$/, 'ecosia'],
  [/(^|\.)yandex\./, 'yandex'],
  [/(^|\.)brave\.com$/, 'brave'],
  [/(^|\.)startpage\.com$/, 'startpage'],
  [/(^|\.)qwant\.com$/, 'qwant'],
  [/(^|\.)mojeek\.com$/, 'mojeek'],
  [/(^|\.)kagi\.com$/, 'kagi'],
  [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)baidu\.com$/, 'baidu'],
  [/(^|\.)naver\.com$/, 'naver'],
  [/(^|\.)github\.com$/, 'github'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)(x|twitter)\.com$/, 'x'],
  [/^t\.co$/, 'x'],
  [/(^|\.)linkedin\.com$/, 'linkedin'],
  [/^lnkd\.in$/, 'linkedin'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)news\.ycombinator\.com$/, 'hackernews'],
  [/(^|\.)producthunt\.com$/, 'producthunt'],
  [/(^|\.)stackoverflow\.com$/, 'stackoverflow'],
]

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, MAX_FIELD_LENGTH)
  return trimmed || undefined
}

function cleanTimestamp(value: unknown, now = Date.now()): Date | undefined {
  if (typeof value !== 'string' && !(value instanceof Date)) return undefined
  const parsed = new Date(value)
  const time = parsed.getTime()
  if (Number.isNaN(time)) return undefined
  if (time > now + MAX_FUTURE_SKEW_MS) return undefined
  if (time < now - MAX_TOUCH_AGE_MS) return undefined
  return parsed
}

function sanitizeTouch(value: unknown): AttributionTouchInput | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  // Own keys only, so a prototype-polluting payload contributes nothing, and a
  // capped count so a huge object cannot be walked.
  const keys = Object.keys(value as Record<string, unknown>).slice(0, MAX_KEYS)
  const input = value as Record<string, unknown>

  const touch: Record<string, unknown> = {}
  for (const key of keys) {
    if ((TOUCH_STRING_FIELDS as readonly string[]).includes(key)) {
      const cleaned = cleanString(input[key])
      if (cleaned) touch[key] = cleaned
    } else if (key === 'at') {
      const at = cleanTimestamp(input[key])
      if (at) touch.at = at
    }
  }

  return Object.keys(touch).length ? (touch as AttributionTouchInput) : undefined
}

function sanitizeEntry(value: unknown): AttributionEntryInput | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  const input = value as Record<string, unknown>
  const landingPath = cleanString(input.landingPath)
  const at = cleanTimestamp(input.at)
  if (!landingPath && !at) return undefined
  return {
    ...(landingPath && { landingPath }),
    ...(at && { at }),
  }
}

export function sanitizeAttribution(value: unknown): AttributionInput | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  const input = value as Record<string, unknown>

  const entry = sanitizeEntry(input.entry)
  const first = sanitizeTouch(input.first)
  const last = sanitizeTouch(input.last)
  const fbp = cleanString(input.fbp)

  if (!entry && !first && !last && !fbp) return undefined

  return {
    ...(entry && { entry }),
    ...(first && { first }),
    ...(last && { last }),
    ...(fbp && { fbp }),
    capturedAt: new Date(),
  }
}

export function normalizeReferrer(referrer: string): string {
  const host = referrer.trim().toLowerCase().replace(/^www\./, '')
  if (!host) return ''
  const app = APP_REFERRERS[host]
  if (app) return app
  for (const [pattern, name] of REFERRER_SOURCES) {
    if (pattern.test(host)) return name
  }
  return host
}

// First touch, not last: the channel that introduced someone to textbee is the
// one that earned the signup, even if they came back through a search later.
export function normalizeSignupSource(
  attribution?: AttributionInput | null,
): string {
  const first = attribution?.first ?? attribution?.last
  if (!first) return 'direct'

  // Run an explicit utm_source through the same host mapping. Some referrers
  // set a hostname as the parameter, notably ChatGPT, which appends
  // utm_source=chatgpt.com. Without this, the same channel lands in two
  // buckets depending on whether the link carried the parameter.
  const source = cleanString(first.source)
  if (source) {
    // Normalisation can empty a value that was not empty, for example a bare
    // "www.", and an empty source is worse than an unmapped one.
    return normalizeReferrer(source) || source.toLowerCase()
  }

  const ref = cleanString(first.ref)
  if (ref) return ref.toLowerCase()

  if (cleanString(first.gclid)) return 'google-ads'
  if (cleanString(first.fbclid)) return 'meta'

  const referrer = cleanString(first.referrer)
  if (referrer) {
    // Same guard as above, but the conclusion differs: an explicit utm_source
    // is intentional and worth keeping verbatim, whereas a referrer that
    // normalises to nothing tells us nothing, so it falls through to direct.
    const normalized = normalizeReferrer(referrer)
    if (normalized) return normalized
  }

  return 'direct'
}

// The device an advert was seen on, which is not proof of what hardware the
// person owns. Reported against milestones.firstDeviceAt rather than used to
// exclude anyone. "unknown" means no user agent reached us at all, which is
// a different fact from "other", a user agent we could not place.
export function classifyDevice(userAgent?: string): string {
  if (!userAgent) return 'unknown'
  const ua = userAgent.toLowerCase()
  if (ua.includes('android')) return 'android'
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (ua.includes('mobile')) return 'other'
  if (/windows|macintosh|mac os x|linux|cros/.test(ua)) return 'desktop'
  return 'other'
}
