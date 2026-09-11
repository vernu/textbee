import { describe, it, expect } from 'vitest'
import {
  buildTouch,
  touchCounts,
  mergeAttribution,
  parseAttribution,
  serializeAttribution,
  readCookie,
  buildCookieString,
  isInternalReferrer,
  ATTRIBUTION_COOKIE,
  type Attribution,
} from '@/lib/analytics/attribution'
import { parseProviders } from '@/lib/analytics/config'

const NOW = new Date('2026-09-11T10:00:00.000Z')

describe('parseProviders', () => {
  it('returns nothing for an unset list, which is the self-host default', () => {
    expect(parseProviders('')).toEqual([])
    expect(parseProviders('   ')).toEqual([])
  })

  it('trims, lowercases, and drops unknown names', () => {
    expect(parseProviders(' GA , clarity,nope, meta ')).toEqual([
      'ga',
      'clarity',
      'meta',
    ])
  })
})

describe('isInternalReferrer', () => {
  it('treats the marketing site and the dashboard as one visit', () => {
    expect(isInternalReferrer('textbee.dev', 'app.textbee.dev')).toBe(true)
    expect(isInternalReferrer('app.textbee.dev', 'app.textbee.dev')).toBe(true)
  })

  it('keeps a genuine external referrer', () => {
    expect(isInternalReferrer('l.facebook.com', 'textbee.dev')).toBe(false)
    expect(isInternalReferrer('news.ycombinator.com', 'textbee.dev')).toBe(false)
  })
})

describe('buildTouch', () => {
  it('reads campaign parameters and click ids from the address', () => {
    const touch = buildTouch({
      search:
        '?utm_source=meta&utm_medium=paid_social&utm_campaign=c1&utm_content=a1&utm_term=s1&fbclid=abc',
      referrer: '',
      pathname: '/pricing',
      hostname: 'textbee.dev',
      now: NOW,
    })

    expect(touch).toMatchObject({
      source: 'meta',
      medium: 'paid_social',
      campaign: 'c1',
      content: 'a1',
      term: 's1',
      fbclid: 'abc',
      landingPath: '/pricing',
      at: NOW.toISOString(),
    })
  })

  it('records an external referrer host but not an internal one', () => {
    expect(
      buildTouch({
        search: '',
        referrer: 'https://www.reddit.com/r/selfhosted/comments/x',
        pathname: '/',
        hostname: 'textbee.dev',
        now: NOW,
      }).referrer
    ).toBe('www.reddit.com')

    expect(
      buildTouch({
        search: '',
        referrer: 'https://app.textbee.dev/dashboard',
        pathname: '/',
        hostname: 'textbee.dev',
        now: NOW,
      }).referrer
    ).toBeUndefined()
  })

  it('caps a field at 200 characters', () => {
    const touch = buildTouch({
      search: `?utm_campaign=${'x'.repeat(500)}`,
      referrer: '',
      pathname: '/',
      hostname: 'textbee.dev',
      now: NOW,
    })
    expect(touch.campaign).toHaveLength(200)
  })

  it('survives a malformed referrer', () => {
    expect(
      buildTouch({
        search: '',
        referrer: 'not a url',
        pathname: '/',
        hostname: 'textbee.dev',
        now: NOW,
      }).referrer
    ).toBeUndefined()
  })
})

describe('touchCounts', () => {
  it('ignores a plain internal page view', () => {
    expect(touchCounts({ landingPath: '/docs', at: NOW.toISOString() })).toBe(
      false
    )
  })

  it('counts a campaign, a ref link, or a click id', () => {
    expect(touchCounts({ source: 'meta' })).toBe(true)
    expect(touchCounts({ ref: 'reddit-selfhosted' })).toBe(true)
    expect(touchCounts({ gclid: 'xyz' })).toBe(true)
    expect(touchCounts({ referrer: 'news.ycombinator.com' })).toBe(true)
  })
})

describe('mergeAttribution', () => {
  it('records only where a direct visit landed, with no touch', () => {
    const merged = mergeAttribution(null, {
      landingPath: '/pricing',
      at: NOW.toISOString(),
    })
    expect(merged).toEqual({
      entry: { landingPath: '/pricing', at: NOW.toISOString() },
    })
  })

  it('lets a later campaign click take first touch after a direct entry', () => {
    // A direct visit must not steal credit from the ad that came after it, so
    // the entry is kept apart from first-touch rather than folded into it.
    const direct = mergeAttribution(null, { landingPath: '/', at: '1' })
    const later = mergeAttribution(direct, { source: 'meta', at: '2' })
    expect(later?.entry).toEqual({ landingPath: '/', at: '1' })
    expect(later?.first?.source).toBe('meta')
    expect(later?.last?.source).toBe('meta')
  })

  it('never rewrites the entry once set', () => {
    const first = mergeAttribution(null, { source: 'meta', landingPath: '/a' })
    const second = mergeAttribution(first, { source: 'reddit', landingPath: '/b' })
    expect(second?.entry?.landingPath).toBe('/a')
  })

  it('sets first and last on the first campaign visit', () => {
    const merged = mergeAttribution(null, { source: 'meta' })
    expect(merged?.first?.source).toBe('meta')
    expect(merged?.last?.source).toBe('meta')
  })

  it('keeps first touch and moves last touch on a later campaign', () => {
    const first = mergeAttribution(null, { source: 'meta' })
    const second = mergeAttribution(first, { source: 'reddit' })
    expect(second?.first?.source).toBe('meta')
    expect(second?.last?.source).toBe('reddit')
  })

  it('leaves both untouched when the visitor just browses on', () => {
    const existing = mergeAttribution(null, { source: 'meta' })
    const after = mergeAttribution(existing, { landingPath: '/pricing' })
    expect(after).toBe(existing)
  })
})

describe('parseAttribution', () => {
  it('returns null for junk rather than throwing', () => {
    expect(parseAttribution(null)).toBeNull()
    expect(parseAttribution('')).toBeNull()
    expect(parseAttribution('{oops')).toBeNull()
    expect(parseAttribution('"a string"')).toBeNull()
    expect(parseAttribution('{}')).toBeNull()
  })

  it('drops unknown keys and non-string values', () => {
    const parsed = parseAttribution(
      JSON.stringify({
        first: { source: 'meta', evil: 'x', campaign: 42 },
        last: { source: 'reddit' },
      })
    )
    expect(parsed?.first).toEqual({ source: 'meta' })
    expect(parsed?.last).toEqual({ source: 'reddit' })
  })

  it('keeps an entry-only cookie and scrubs junk inside it', () => {
    const parsed = parseAttribution(
      JSON.stringify({ entry: { landingPath: '/docs', at: 'x', evil: 1 } })
    )
    expect(parsed).toEqual({ entry: { landingPath: '/docs', at: 'x' } })
  })
})

describe('serializeAttribution', () => {
  it('round-trips a normal value untouched', () => {
    const attribution: Attribution = {
      entry: { landingPath: '/', at: NOW.toISOString() },
      first: { source: 'meta', campaign: 'c1' },
      last: { source: 'reddit' },
    }
    expect(parseAttribution(serializeAttribution(attribution))).toEqual(
      attribution
    )
  })

  it('sheds last touch before the entry, and the entry before first touch', () => {
    const long = 'x'.repeat(200)
    const fatTouch = {
      source: long,
      medium: long,
      campaign: long,
      content: long,
      term: long,
      ref: long,
      referrer: long,
      landingPath: long,
      fbclid: long,
      gclid: long,
    }
    const entry = { landingPath: '/', at: NOW.toISOString() }

    // Two fat touches do not fit; one fat touch plus the entry does.
    const shedLast = parseAttribution(
      serializeAttribution({ entry, first: fatTouch, last: fatTouch })
    )
    expect(shedLast?.last).toBeUndefined()
    expect(shedLast?.entry).toEqual(entry)
    expect(shedLast?.first?.source).toBe(long)

    // A single touch so fat that even the tiny entry tips it over.
    const enormous = { ...fatTouch, source: 'y'.repeat(200) }
    const stillFat = parseAttribution(
      serializeAttribution({
        entry: { landingPath: 'z'.repeat(200), at: NOW.toISOString() },
        first: enormous,
      })
    )
    expect(stillFat?.first?.source).toBeTruthy()
  })

  it('sheds data rather than letting the browser drop an oversized cookie', () => {
    const long = 'x'.repeat(200)
    const fat: Attribution = {
      first: {
        source: long,
        medium: long,
        campaign: long,
        content: long,
        term: long,
        ref: long,
        referrer: long,
        landingPath: long,
        fbclid: long,
        gclid: long,
      },
      last: {
        source: long,
        medium: long,
        campaign: long,
        content: long,
        term: long,
        ref: long,
        referrer: long,
        landingPath: long,
        fbclid: long,
        gclid: long,
      },
    }

    const serialized = serializeAttribution(fat)
    expect(encodeURIComponent(serialized).length).toBeLessThanOrEqual(3800)
    expect(parseAttribution(serialized)?.first?.source).toBeTruthy()
  })
})

describe('cookie helpers', () => {
  it('reads one cookie out of many', () => {
    const jar = `theme=dark; ${ATTRIBUTION_COOKIE}=${encodeURIComponent(
      '{"first":{"source":"meta"}}'
    )}; _fbp=fb.1.123.456`
    expect(parseAttribution(readCookie(ATTRIBUTION_COOKIE, jar))?.first?.source).toBe(
      'meta'
    )
    expect(readCookie('_fbp', jar)).toBe('fb.1.123.456')
    expect(readCookie('missing', jar)).toBeNull()
  })

  it('adds the shared domain and Secure only when asked', () => {
    const shared = buildCookieString('{}', {
      domain: '.textbee.dev',
      secure: true,
    })
    expect(shared).toContain('domain=.textbee.dev')
    expect(shared).toContain('Secure')
    expect(shared).toContain('SameSite=Lax')
    expect(shared).toContain('max-age=7776000')

    const local = buildCookieString('{}', { secure: false })
    expect(local).not.toContain('domain=')
    expect(local).not.toContain('Secure')
  })
})
