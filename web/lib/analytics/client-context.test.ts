import { describe, it, expect } from 'vitest'
import {
  clientIpFromHeaders,
  clientCountryFromHeaders,
  clientContextFromHeaders,
} from '@/lib/analytics/client-context'

/*
 * Registration is posted to the API by this Next server, not by the browser, so
 * unless the browser's own details are read here and forwarded, every account
 * is recorded against the server instead of the visitor.
 */
describe('clientIpFromHeaders', () => {
  it('takes the client from the front of the forwarded chain', () => {
    expect(
      clientIpFromHeaders({
        'x-forwarded-for': '203.0.113.4, 70.41.3.18, 150.172.238.178',
      })
    ).toBe('203.0.113.4')
  })

  it('handles a single address with no chain', () => {
    expect(clientIpFromHeaders({ 'x-forwarded-for': '203.0.113.4' })).toBe(
      '203.0.113.4'
    )
  })

  it('handles the header arriving as an array', () => {
    expect(
      clientIpFromHeaders({ 'x-forwarded-for': ['203.0.113.4', '10.0.0.1'] })
    ).toBe('203.0.113.4')
  })

  it('falls back to x-real-ip', () => {
    expect(clientIpFromHeaders({ 'x-real-ip': '203.0.113.9' })).toBe(
      '203.0.113.9'
    )
  })

  it('returns nothing when there is no address header', () => {
    expect(clientIpFromHeaders({})).toBeUndefined()
    expect(clientIpFromHeaders(undefined)).toBeUndefined()
    expect(clientIpFromHeaders({ 'x-forwarded-for': '' })).toBeUndefined()
  })
})

describe('clientContextFromHeaders', () => {
  it('collects the browser user agent and address', () => {
    expect(
      clientContextFromHeaders({
        'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
        'x-forwarded-for': '203.0.113.4',
      })
    ).toEqual({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
      ip: '203.0.113.4',
    })
  })

  it('omits a field rather than sending an empty one', () => {
    expect(
      clientContextFromHeaders({ 'user-agent': 'Mozilla/5.0' })
    ).toEqual({ userAgent: 'Mozilla/5.0' })
  })

  it('returns undefined when there is nothing worth sending', () => {
    expect(clientContextFromHeaders({})).toBeUndefined()
    expect(clientContextFromHeaders(undefined)).toBeUndefined()
  })

  it('caps an absurd user agent before it leaves the server', () => {
    const result = clientContextFromHeaders({ 'user-agent': 'x'.repeat(5000) })
    expect(result?.userAgent).toHaveLength(512)
  })
})

describe('clientCountryFromHeaders', () => {
  it('reads the region the edge placed the visitor in', () => {
    expect(clientCountryFromHeaders({ 'cf-ipcountry': 'DE' })).toBe('DE')
  })

  it('prefers the edge over the hosting platform, which sees the edge', () => {
    expect(
      clientCountryFromHeaders({
        'cf-ipcountry': 'DE',
        'x-vercel-ip-country': 'US',
      })
    ).toBe('DE')
  })

  it('falls back to the platform header when there is no edge in front', () => {
    expect(clientCountryFromHeaders({ 'x-vercel-ip-country': 'us' })).toBe('US')
  })

  it.each(['XX', 'T1'])('drops %s, which places nobody', (code) => {
    expect(clientCountryFromHeaders({ 'cf-ipcountry': code })).toBeUndefined()
  })

  it.each(['', 'D', 'DEU', 'Germany'])('rejects %s', (bad) => {
    expect(clientCountryFromHeaders({ 'cf-ipcountry': bad })).toBeUndefined()
  })

  it('returns nothing when no header carries a region', () => {
    expect(clientCountryFromHeaders({})).toBeUndefined()
    expect(clientCountryFromHeaders(undefined)).toBeUndefined()
  })
})

describe('clientContextFromHeaders with a region', () => {
  it('prefers the edge address over the rewritten forwarded chain', () => {
    expect(
      clientContextFromHeaders({
        'cf-connecting-ip': '203.0.113.4',
        'x-forwarded-for': '150.172.238.178',
        'cf-ipcountry': 'DE',
        'user-agent': 'Mozilla/5.0',
      })
    ).toEqual({
      userAgent: 'Mozilla/5.0',
      ip: '203.0.113.4',
      country: 'DE',
    })
  })

  it('forwards a region even when nothing else is known', () => {
    expect(clientContextFromHeaders({ 'cf-ipcountry': 'ET' })).toEqual({
      country: 'ET',
    })
  })
})
