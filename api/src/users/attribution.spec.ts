import {
  classifyDevice,
  normalizeReferrer,
  normalizeSignupSource,
  sanitizeAttribution,
} from './attribution'

describe('normalizeSignupSource', () => {
  it('falls back to direct with nothing to go on', () => {
    expect(normalizeSignupSource(undefined)).toBe('direct')
    expect(normalizeSignupSource(null)).toBe('direct')
    expect(normalizeSignupSource({})).toBe('direct')
    expect(normalizeSignupSource({ first: { landingPath: '/' } })).toBe('direct')
    // An entry records where a direct visit landed and must never earn credit.
    expect(normalizeSignupSource({ entry: { landingPath: '/pricing' } })).toBe(
      'direct',
    )
  })

  it('names the app behind an Android in-app browser referrer', () => {
    expect(
      normalizeSignupSource({ first: { referrer: 'org.telegram.messenger' } }),
    ).toBe('telegram')
    expect(
      normalizeSignupSource({ first: { referrer: 'com.instagram.android' } }),
    ).toBe('meta')
  })

  it('folds a hostname utm_source into the same bucket as the referrer', () => {
    // ChatGPT appends utm_source=chatgpt.com to links it surfaces, so without
    // this the channel is split across two names.
    expect(normalizeSignupSource({ first: { source: 'chatgpt.com' } })).toBe('chatgpt')
    expect(normalizeSignupSource({ first: { referrer: 'chatgpt.com' } })).toBe('chatgpt')
    expect(normalizeSignupSource({ first: { source: 'www.perplexity.ai' } })).toBe('perplexity')
  })

  it('never returns an empty source, even when normalisation empties it', () => {
    // "www." survives cleanString but the host mapping strips it to nothing.
    expect(normalizeSignupSource({ first: { source: 'www.' } })).toBe('www.')
    expect(normalizeSignupSource({ first: { referrer: 'www.' } })).toBe('direct')
  })

  it('leaves a plain utm_source alone', () => {
    expect(normalizeSignupSource({ first: { source: 'meta' } })).toBe('meta')
    expect(normalizeSignupSource({ first: { source: 'Newsletter' } })).toBe('newsletter')
    expect(normalizeSignupSource({ first: { source: 'google' } })).toBe('google')
  })

  it('prefers an explicit utm_source', () => {
    expect(
      normalizeSignupSource({
        first: { source: 'Meta', fbclid: 'abc', referrer: 'reddit.com' },
      }),
    ).toBe('meta')
  })

  it('uses a ref parameter when there is no utm_source', () => {
    expect(normalizeSignupSource({ first: { ref: 'reddit-selfhosted' } })).toBe(
      'reddit-selfhosted',
    )
  })

  it('reads the channel from a click id when nothing else is present', () => {
    expect(normalizeSignupSource({ first: { gclid: 'xyz' } })).toBe('google-ads')
    expect(normalizeSignupSource({ first: { fbclid: 'xyz' } })).toBe('meta')
  })

  it('credits first touch, not last', () => {
    expect(
      normalizeSignupSource({
        first: { source: 'meta' },
        last: { source: 'google' },
      }),
    ).toBe('meta')
  })

  it('falls back to last touch when first touch was never recorded', () => {
    expect(normalizeSignupSource({ last: { source: 'reddit' } })).toBe('reddit')
  })
})

describe('normalizeReferrer', () => {
  const cases: Array<[string, string]> = [
    ['facebook.com', 'meta'],
    ['m.facebook.com', 'meta'],
    ['l.facebook.com', 'meta'],
    ['lm.facebook.com', 'meta'],
    ['instagram.com', 'meta'],
    ['l.instagram.com', 'meta'],
    ['www.google.com', 'google'],
    ['google.co.uk', 'google'],
    ['bing.com', 'bing'],
    ['duckduckgo.com', 'duckduckgo'],
    ['chatgpt.com', 'chatgpt'],
    ['chat.openai.com', 'chatgpt'],
    ['gemini.google.com', 'gemini'],
    ['claude.ai', 'claude'],
    ['perplexity.ai', 'perplexity'],
    ['copilot.microsoft.com', 'copilot'],
    ['meta.ai', 'meta-ai'],
    ['github.com', 'github'],
    ['reddit.com', 'reddit'],
    ['old.reddit.com', 'reddit'],
    ['t.co', 'x'],
    ['x.com', 'x'],
    ['twitter.com', 'x'],
    ['linkedin.com', 'linkedin'],
    ['lnkd.in', 'linkedin'],
    ['youtube.com', 'youtube'],
    ['youtu.be', 'youtube'],
    ['news.ycombinator.com', 'hackernews'],
    ['producthunt.com', 'producthunt'],
    ['search.brave.com', 'brave'],
    ['startpage.com', 'startpage'],
    ['kagi.com', 'kagi'],
    ['search.yahoo.com', 'yahoo'],
    ['baidu.com', 'baidu'],
    ['mail.google.com', 'gmail'],
    ['news.google.com', 'google-news'],
  ]

  it.each(cases)('maps %s to %s', (host, expected) => {
    expect(normalizeReferrer(host)).toBe(expected)
  })

  // Android in-app browsers send android-app://<package>/ as the referrer, so
  // the host that reaches here is a package name, not a domain.
  const appCases: Array<[string, string]> = [
    ['com.instagram.android', 'meta'],
    ['com.facebook.katana', 'meta'],
    ['com.facebook.lite', 'meta'],
    ['com.facebook.orca', 'meta'],
    ['com.twitter.android', 'x'],
    ['com.reddit.frontpage', 'reddit'],
    ['com.linkedin.android', 'linkedin'],
    ['org.telegram.messenger', 'telegram'],
    ['com.whatsapp', 'whatsapp'],
    ['com.discord', 'discord'],
    ['com.Slack', 'slack'],
    ['com.microsoft.teams', 'teams'],
    ['com.google.android.gm', 'gmail'],
    ['com.google.android.googlequicksearchbox', 'google'],
  ]

  it.each(appCases)('maps the %s app to %s', (pkg, expected) => {
    expect(normalizeReferrer(pkg)).toBe(expected)
  })

  it('does not let a search engine domain swallow its assistant', () => {
    expect(normalizeReferrer('gemini.google.com')).toBe('gemini')
    expect(normalizeReferrer('www.google.com')).toBe('google')
  })

  it('does not let Google search swallow Gmail', () => {
    // Gmail sits on google.com, and the generic google rule would otherwise
    // count every emailed link as an organic search visit.
    expect(normalizeReferrer('mail.google.com')).toBe('gmail')
    expect(normalizeReferrer('google.com')).toBe('google')
  })

  it('keeps an unrecognised host so a new channel is still visible', () => {
    expect(normalizeReferrer('some-blog.example')).toBe('some-blog.example')
  })

  it('is case and www insensitive', () => {
    expect(normalizeReferrer('WWW.Reddit.com')).toBe('reddit')
  })
})

describe('classifyDevice', () => {
  it('reads the device class from the user agent', () => {
    expect(
      classifyDevice(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36',
      ),
    ).toBe('android')
    expect(
      classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'),
    ).toBe('ios')
    expect(
      classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
    ).toBe('desktop')
    expect(classifyDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(
      'desktop',
    )
  })

  it('tells a missing user agent apart from one it cannot place', () => {
    expect(classifyDevice(undefined)).toBe('unknown')
    expect(classifyDevice('')).toBe('unknown')
    expect(classifyDevice('curl/8.4.0')).toBe('other')
  })
})

describe('sanitizeAttribution', () => {
  it('rejects anything that is not an object of touches', () => {
    expect(sanitizeAttribution(undefined)).toBeUndefined()
    expect(sanitizeAttribution(null)).toBeUndefined()
    expect(sanitizeAttribution('meta')).toBeUndefined()
    expect(sanitizeAttribution(42)).toBeUndefined()
    expect(sanitizeAttribution([{ source: 'meta' }])).toBeUndefined()
    expect(sanitizeAttribution({})).toBeUndefined()
    expect(sanitizeAttribution({ first: 'meta' })).toBeUndefined()
  })

  it('keeps only known fields', () => {
    const result = sanitizeAttribution({
      first: { source: 'meta', campaign: 'c1', evil: 'drop me' },
      last: { source: 'reddit' },
      fbp: 'fb.1.123.456',
      somethingElse: 'drop me',
    })

    expect(result?.first).toEqual({ source: 'meta', campaign: 'c1' })
    expect(result?.last).toEqual({ source: 'reddit' })
    expect(result?.fbp).toBe('fb.1.123.456')
    expect(result as any).not.toHaveProperty('somethingElse')
  })

  it('drops non-string values instead of storing them', () => {
    const result = sanitizeAttribution({
      first: { source: { $ne: null }, campaign: 42, ref: ['a'] },
    })
    expect(result).toBeUndefined()
  })

  it('caps a long field at 200 characters', () => {
    const result = sanitizeAttribution({
      first: { campaign: 'x'.repeat(5000) },
    })
    expect(result?.first?.campaign).toHaveLength(200)
  })

  it('ignores a huge object rather than walking all of it', () => {
    const first: Record<string, string> = { source: 'meta' }
    for (let i = 0; i < 5000; i++) first[`junk${i}`] = 'x'

    const result = sanitizeAttribution({ first })
    expect(Object.keys(result?.first ?? {}).length).toBeLessThanOrEqual(20)
  })

  it('does not read inherited or prototype keys', () => {
    const first = Object.create({ source: 'inherited' })
    first.campaign = 'c1'

    const result = sanitizeAttribution({ first })
    expect(result?.first?.source).toBeUndefined()
    expect(result?.first?.campaign).toBe('c1')

    const polluted = JSON.parse('{"first":{"__proto__":{"source":"evil"}}}')
    expect(sanitizeAttribution(polluted)).toBeUndefined()
    expect(({} as any).source).toBeUndefined()
  })

  it('parses a valid timestamp and drops an invalid one', () => {
    const recent = new Date(Date.now() - 60_000).toISOString()
    expect(sanitizeAttribution({ first: { at: recent } })?.first?.at).toEqual(
      new Date(recent),
    )

    expect(
      sanitizeAttribution({ first: { source: 'meta', at: 'never' } })?.first?.at,
    ).toBeUndefined()
  })

  it('tolerates ordinary clock skew but not a fictional time', () => {
    const at = (offsetMs: number) =>
      sanitizeAttribution({
        first: { source: 'meta', at: new Date(Date.now() + offsetMs).toISOString() },
      })?.first?.at

    // A browser clock two minutes fast is normal and worth keeping.
    expect(at(2 * 60 * 1000)).toBeInstanceOf(Date)
    // An hour in the future, or older than the cookie could possibly be, is not.
    expect(at(60 * 60 * 1000)).toBeUndefined()
    expect(at(-500 * 24 * 60 * 60 * 1000)).toBeUndefined()
  })

  it('keeps the entry with only its own two fields', () => {
    const result = sanitizeAttribution({
      entry: { landingPath: '/pricing', at: 'never', source: 'sneaky' },
    })
    expect(result?.entry).toEqual({ landingPath: '/pricing' })
    expect(result?.first).toBeUndefined()

    expect(sanitizeAttribution({ entry: {} })).toBeUndefined()
    expect(sanitizeAttribution({ entry: 'meta' })).toBeUndefined()
  })

  it('stamps when it was captured', () => {
    const result = sanitizeAttribution({ first: { source: 'meta' } })
    expect(result?.capturedAt).toBeInstanceOf(Date)
  })
})
