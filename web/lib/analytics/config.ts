// Analytics providers load only when named here AND given an id, so an
// instance with no configuration loads no third-party scripts at all.

export type AnalyticsProvider = 'ga' | 'clarity' | 'meta'

const KNOWN_PROVIDERS: AnalyticsProvider[] = ['ga', 'clarity', 'meta']

// Next inlines process.env.NEXT_PUBLIC_* at build time only for full static
// member expressions, so each one is read literally rather than by lookup.
const RAW_PROVIDERS = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDERS ?? ''

const PROVIDER_IDS: Record<AnalyticsProvider, string | undefined> = {
  ga: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  clarity: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  meta: process.env.NEXT_PUBLIC_META_PIXEL_ID,
}

export function parseProviders(raw: string): AnalyticsProvider[] {
  return raw
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name): name is AnalyticsProvider =>
      (KNOWN_PROVIDERS as string[]).includes(name)
    )
}

const enabledProviders = parseProviders(RAW_PROVIDERS)

const warned = new Set<string>()

export function providerId(provider: AnalyticsProvider): string | undefined {
  const id = PROVIDER_IDS[provider]
  return id && id.trim() ? id.trim() : undefined
}

export function isEnabled(provider: AnalyticsProvider): boolean {
  if (!enabledProviders.includes(provider)) return false

  if (!providerId(provider)) {
    if (process.env.NODE_ENV === 'development' && !warned.has(provider)) {
      warned.add(provider)
      console.warn(
        `[analytics] "${provider}" is listed in NEXT_PUBLIC_ANALYTICS_PROVIDERS but its id env var is empty, so it will not load.`
      )
    }
    return false
  }

  return true
}

export function enabledProviderList(): AnalyticsProvider[] {
  return enabledProviders.filter(isEnabled)
}
