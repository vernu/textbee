import { resolveRequestContext } from './request-context'

// The suite must leave the environment as it found it, so a value already set
// when the process started survives.
const ORIGINAL_ENV = { ...process.env }
function restoreEnv(key: string) {
  if (ORIGINAL_ENV[key] === undefined) delete process.env[key]
  else process.env[key] = ORIGINAL_ENV[key]
}

/*
 * The dashboard proxies registration, so without forwarding, every account was
 * recorded with the dashboard server's user agent and address. That made
 * signupDevice useless and sent the wrong browser context to ad platforms,
 * which hurts identity matching more than sending nothing would.
 */
describe('resolveRequestContext', () => {
  const proxyReq = {
    ip: '10.0.0.1',
    headers: { 'user-agent': 'axios/1.7.2' },
  }

  it('prefers the forwarded browser values over the proxy request', () => {
    expect(
      resolveRequestContext(
        {
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
          ip: '203.0.113.4',
        },
        proxyReq,
      ),
    ).toEqual({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
      ip: '203.0.113.4',
    })
  })

  it('falls back to the request when nothing is forwarded', () => {
    expect(resolveRequestContext(undefined, proxyReq)).toEqual({
      userAgent: 'axios/1.7.2',
      ip: '10.0.0.1',
    })
  })

  it('falls back per field, not all or nothing', () => {
    expect(resolveRequestContext({ ip: '203.0.113.4' }, proxyReq)).toEqual({
      userAgent: 'axios/1.7.2',
      ip: '203.0.113.4',
    })
  })

  it('returns nothing rather than guessing when there is no source at all', () => {
    expect(resolveRequestContext(undefined, undefined)).toEqual({
      userAgent: undefined,
      ip: undefined,
    })
  })

  describe('treats the forwarded values as untrusted', () => {
    it('ignores non-strings', () => {
      expect(
        resolveRequestContext({ userAgent: { $ne: null }, ip: 42 }, undefined),
      ).toEqual({ userAgent: undefined, ip: undefined })
    })

    it('caps a long user agent', () => {
      const result = resolveRequestContext(
        { userAgent: 'x'.repeat(5000) },
        undefined,
      )
      expect(result.userAgent).toHaveLength(512)
    })

    it('strips control characters so a log line cannot be forged', () => {
      const injected = 'Mozilla/5.0\r\n[Nest] LOG fake entry'
      const result = resolveRequestContext({ userAgent: injected }, undefined)

      expect(result.userAgent).not.toContain('\n')
      expect(result.userAgent).not.toContain('\r')
      expect(result.userAgent).toBe('Mozilla/5.0[Nest] LOG fake entry')
    })

    // The last six pass a character allowlist but are not addresses, which is
    // why the check parses rather than pattern matches.
    it.each([
      'not-an-ip',
      '<script>alert(1)</script>',
      '203.0.113.4; DROP',
      'x'.repeat(60),
      '',
      '   ',
      '::::',
      '203.0.113.999',
      '1.2.3.4:5',
      '1.2.3',
      '1.2.3.4.5',
      '...',
    ])('rejects %s, which does not parse as an address', (bad) => {
      expect(resolveRequestContext({ ip: bad }, undefined).ip).toBeUndefined()
    })

    it('accepts ordinary IPv4 and IPv6 forms', () => {
      for (const good of [
        '203.0.113.4',
        '2001:db8::8a2e:370:7334',
        '::ffff:203.0.113.4',
      ]) {
        expect(resolveRequestContext({ ip: good }, undefined).ip).toBe(good)
      }
    })
  })

  describe('region', () => {
    const edgeReq = {
      ip: '10.0.0.1',
      headers: {
        'user-agent': 'axios/1.7.2',
        'cf-connecting-ip': '198.51.100.7',
        'cf-ipcountry': 'US',
      },
    }

    afterEach(() => {
      restoreEnv('TRUSTED_PROXY')
    })

    it('prefers the region the browser reported', () => {
      process.env.TRUSTED_PROXY = 'cloudflare'
      expect(resolveRequestContext({ country: 'de' }, edgeReq).country).toBe(
        'DE',
      )
    })

    it('falls back to the region the edge placed the caller in', () => {
      process.env.TRUSTED_PROXY = 'cloudflare'
      expect(resolveRequestContext(undefined, edgeReq).country).toBe('US')
    })

    it('drops a forwarded region that is not a region code', () => {
      expect(
        resolveRequestContext({ country: 'Germany' }, undefined).country,
      ).toBeUndefined()
      expect(
        resolveRequestContext({ country: 'XX' }, undefined).country,
      ).toBeUndefined()
    })

    it('reports no region when no edge is declared', () => {
      expect(resolveRequestContext(undefined, edgeReq).country).toBeUndefined()
    })

    it('still takes the address from the proxy request when nothing is forwarded', () => {
      expect(resolveRequestContext(undefined, edgeReq).ip).toBe('10.0.0.1')
    })
  })
})
