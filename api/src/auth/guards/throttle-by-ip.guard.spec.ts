import { ThrottlerByIpGuard } from './throttle-by-ip.guard'

/*
 * The limiter keyed on the raw forwarded header, which any hop can append to,
 * and behind an edge network that made every caller look like the edge. It
 * now keys on the caller the edge names, reduced to one value per network so
 * a client cannot shed its count by rotating inside its IPv6 allocation.
 */
describe('ThrottlerByIpGuard', () => {
  const guard = new (ThrottlerByIpGuard as any)({}, {}, {}) as any
  const key = (req: any) => guard.extractIP(req)

  const ORIGINAL = process.env.TRUSTED_PROXY
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.TRUSTED_PROXY
    else process.env.TRUSTED_PROXY = ORIGINAL
  })

  it('keys on the caller the edge names, not the proxy hop', () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    expect(
      key({ ip: '10.0.0.1', headers: { 'cf-connecting-ip': '203.0.113.9' } }),
    ).toBe('203.0.113.9')
  })

  it('gives one key to a whole IPv6 network', () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    const first = key({
      ip: '10.0.0.1',
      headers: { 'cf-connecting-ip': '2001:db8:1:2:3:4:5:6' },
    })
    const second = key({
      ip: '10.0.0.1',
      headers: { 'cf-connecting-ip': '2001:db8:1:2:ffff::9' },
    })

    expect(first).toBe('2001:db8:1:2::/64')
    expect(second).toBe(first)
  })

  it('separates different IPv6 networks', () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    expect(
      key({
        ip: '10.0.0.1',
        headers: { 'cf-connecting-ip': '2001:db8:1:3::1' },
      }),
    ).not.toBe(
      key({
        ip: '10.0.0.1',
        headers: { 'cf-connecting-ip': '2001:db8:1:2::1' },
      }),
    )
  })

  it('ignores the forwarded chain, which the caller controls', () => {
    expect(
      key({
        ip: '203.0.113.9',
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      }),
    ).toBe('203.0.113.9')
  })

  it('still produces a key when the address does not parse', () => {
    expect(key({ ip: 'unix:/tmp/sock', headers: {} })).toBe('unix:/tmp/sock')
  })
})
