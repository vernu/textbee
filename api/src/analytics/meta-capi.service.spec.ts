import axios from 'axios'
import { createHash } from 'crypto'
import { MetaCapiService } from './meta-capi.service'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

describe('MetaCapiService', () => {
  const originalEnv = process.env
  let service: MetaCapiService

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.META_PIXEL_ID = '1603269904673257'
    process.env.META_CAPI_ACCESS_TOKEN = 'test-token'
    process.env.FRONTEND_URL = 'https://app.example.com'
    delete process.env.META_CAPI_TEST_EVENT_CODE
    mockedAxios.post.mockResolvedValue({ data: {} } as any)
    service = new MetaCapiService()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  const send = () =>
    service.send({
      name: 'CompleteRegistration',
      user: {
        userId: 'user-1',
        email: '  Ada@Example.COM ',
        ip: '203.0.113.4',
        userAgent: 'Mozilla/5.0',
        fbclid: 'click-1',
        fbclidAt: new Date(1757577600000),
        fbp: 'fb.1.1757577600000.99',
      },
      sourcePath: '/register',
    })

  const lastBody = () => mockedAxios.post.mock.calls[0][1] as any
  const lastUrl = () => mockedAxios.post.mock.calls[0][0] as string

  it('sends nothing when the pixel or token is missing', async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN
    await send()
    expect(mockedAxios.post).not.toHaveBeenCalled()

    process.env.META_CAPI_ACCESS_TOKEN = 'test-token'
    delete process.env.META_PIXEL_ID
    await send()
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  it('posts to the pixel events endpoint on a pinned api version', async () => {
    await send()
    expect(lastUrl()).toMatch(
      /^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/1603269904673257\/events$/,
    )
  })

  it('keeps the access token out of the url', async () => {
    await send()
    expect(lastUrl()).not.toContain('access_token')
    expect(lastBody().access_token).toBe('test-token')
  })

  it('includes event_time in seconds, which Meta rejects the event without', async () => {
    await send()
    const event = lastBody().data[0]

    expect(typeof event.event_time).toBe('number')
    expect(Number.isInteger(event.event_time)).toBe(true)
    // Seconds, not milliseconds: a millisecond value would be far in the future.
    expect(Math.abs(event.event_time - Date.now() / 1000)).toBeLessThan(60)
  })

  it('hashes the email and the account id, and normalises the email first', async () => {
    await send()
    const userData = lastBody().data[0].user_data

    expect(userData.em).toBe(sha256('ada@example.com'))
    expect(userData.em).not.toContain('@')
    expect(userData.external_id).toBe(sha256('user-1'))
    expect(JSON.stringify(lastBody())).not.toContain('Ada@Example.COM')
  })

  it('formats the click id the way Meta expects', async () => {
    await send()
    expect(lastBody().data[0].user_data.fbc).toBe('fb.1.1757577600000.click-1')
    expect(lastBody().data[0].user_data.fbp).toBe('fb.1.1757577600000.99')
  })

  it('passes browser context only when there is any', async () => {
    await service.send({
      name: 'Purchase',
      user: { userId: 'user-2', email: 'a@b.com' },
      customData: { value: 12.5, currency: 'USD' },
    })
    const userData = lastBody().data[0].user_data

    expect(userData.client_ip_address).toBeUndefined()
    expect(userData.client_user_agent).toBeUndefined()
    expect(userData.fbc).toBeUndefined()
  })

  it('builds a stable event id so a retry deduplicates', async () => {
    await send()
    expect(lastBody().data[0].event_id).toBe('CompleteRegistration:user-1')

    jest.clearAllMocks()
    await service.send({
      name: 'Purchase',
      user: { userId: 'user-1' },
      idSuffix: 'sub_123',
    })
    expect(lastBody().data[0].event_id).toBe('Purchase:user-1:sub_123')
  })

  it('puts the test event code beside data, not inside the event', async () => {
    process.env.META_CAPI_TEST_EVENT_CODE = 'TEST123'
    await send()

    expect(lastBody().test_event_code).toBe('TEST123')
    expect(lastBody().data[0].test_event_code).toBeUndefined()
  })

  it('omits the test event code once it is unset', async () => {
    await send()
    expect(lastBody().test_event_code).toBeUndefined()
  })

  it('carries custom data and the source url', async () => {
    await service.send({
      name: 'Purchase',
      user: { userId: 'user-3' },
      sourcePath: '/dashboard/account',
      customData: { value: 6, currency: 'USD' },
    })
    const event = lastBody().data[0]

    expect(event.custom_data).toEqual({ value: 6, currency: 'USD' })
    expect(event.event_source_url).toBe(
      'https://app.example.com/dashboard/account',
    )
    expect(event.action_source).toBe('website')
  })

  it('gives up rather than hanging on a slow response', async () => {
    await send()
    expect(mockedAxios.post.mock.calls[0][2]).toMatchObject({ timeout: 5000 })
  })
})
