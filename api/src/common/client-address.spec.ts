import {
  canonicalAddress,
  cleanCountry,
  rawAddress,
  resolveClientAddress,
} from './client-address'

/*
 * The app sits behind a reverse proxy and, in the hosted deployment, a CDN in
 * front of that. Every request therefore arrives with the edge's address on
 * the socket, which made the rate limiter see one client and gave conversion
 * reporting a single useless address for everyone.
 */
describe('rawAddress', () => {
  it('keeps an ordinary address whole', () => {
    expect(rawAddress('203.0.113.4')).toBe('203.0.113.4')
    expect(rawAddress('2001:db8::8a2e:370:7334')).toBe(
      '2001:db8::8a2e:370:7334',
    )
  })

  it('unwraps an IPv4 caller reported through a dual-stack socket', () => {
    expect(rawAddress('::ffff:203.0.113.4')).toBe('203.0.113.4')
  })

  it('lower cases and drops the interface suffix', () => {
    expect(rawAddress('2001:DB8::1')).toBe('2001:db8::1')
    expect(rawAddress('fe80::1%en0')).toBe('fe80::1')
  })

  it.each([
    '::::',
    '203.0.113.999',
    '1.2.3.4:5',
    '1.2.3',
    '',
    '   ',
    'not an address',
    undefined,
    null,
    42,
    { ip: '203.0.113.4' },
  ])('rejects %p', (bad) => {
    expect(rawAddress(bad as unknown)).toBeUndefined()
  })
})

describe('canonicalAddress', () => {
  it('keeps IPv4 whole', () => {
    expect(canonicalAddress('203.0.113.4')).toBe('203.0.113.4')
    expect(canonicalAddress('::ffff:203.0.113.4')).toBe('203.0.113.4')
  })

  // A carrier hands out a /64 and the phone picks a new interface id within it
  // several times a day, so the full address would count one phone many times.
  it.each([
    ['2001:db8:1:2:3:4:5:6', '2001:db8:1:2::/64'],
    ['2001:db8:1:2:aaaa:bbbb:cccc:dddd', '2001:db8:1:2::/64'],
    ['2001:DB8:1:2::1', '2001:db8:1:2::/64'],
    ['2001:db8::1', '2001:db8:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
    ['2001:db8:1:2::203.0.113.4', '2001:db8:1:2::/64'],
  ])('reduces %s to its network %s', (input, expected) => {
    expect(canonicalAddress(input)).toBe(expected)
  })

  it('gives one value for two addresses on the same network', () => {
    expect(canonicalAddress('2001:db8:1:2:3:4:5:6')).toBe(
      canonicalAddress('2001:db8:1:2:9999::1'),
    )
  })

  it('separates different networks', () => {
    expect(canonicalAddress('2001:db8:1:2::1')).not.toBe(
      canonicalAddress('2001:db8:1:3::1'),
    )
  })
})

describe('cleanCountry', () => {
  it('normalises a two-letter code', () => {
    expect(cleanCountry('de')).toBe('DE')
    expect(cleanCountry(' us ')).toBe('US')
  })

  it.each(['XX', 'T1', 'xx', 't1'])('drops the unplaced code %s', (code) => {
    expect(cleanCountry(code)).toBeUndefined()
  })

  it.each(['', 'D', 'DEU', 'D1', '12', 'ET;DROP', undefined, null, 7])(
    'rejects %p',
    (bad) => {
      expect(cleanCountry(bad as unknown)).toBeUndefined()
    },
  )
})

describe('resolveClientAddress', () => {
  const edgeRequest = {
    ip: '10.0.0.1',
    headers: {
      'cf-connecting-ip': '203.0.113.9',
      'cf-ipcountry': 'DE',
    },
  }

  afterEach(() => {
    delete process.env.TRUSTED_PROXY
  })

  it('uses the proxy hop and reports no region when no edge is declared', () => {
    expect(resolveClientAddress(edgeRequest)).toEqual({ ip: '10.0.0.1' })
  })

  it('reads the caller and the region from the edge when one is declared', () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    expect(resolveClientAddress(edgeRequest)).toEqual({
      ip: '203.0.113.9',
      country: 'DE',
    })
  })

  it('falls back to the proxy hop when the edge header is missing', () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    expect(
      resolveClientAddress({
        ip: '10.0.0.1',
        headers: { 'cf-ipcountry': 'DE' },
      }),
    ).toEqual({ ip: '10.0.0.1', country: 'DE' })
  })

  it('ignores an edge header that does not parse as an address', () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    expect(
      resolveClientAddress({
        ip: '10.0.0.1',
        headers: { 'cf-connecting-ip': '203.0.113.999; DROP' },
      }),
    ).toEqual({ ip: '10.0.0.1' })
  })

  it('takes the first value when a header arrives more than once', () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    expect(
      resolveClientAddress({
        headers: {
          'cf-connecting-ip': ['203.0.113.9', '198.51.100.4'],
          'cf-ipcountry': ['DE', 'US'],
        },
      }),
    ).toEqual({ ip: '203.0.113.9', country: 'DE' })
  })

  it('returns nothing rather than a partial value for an empty request', () => {
    expect(resolveClientAddress(undefined)).toEqual({})
    expect(resolveClientAddress({})).toEqual({})
  })
})
