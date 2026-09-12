import { Test } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { AccessFootprintService } from './access-footprint.service'
import { AccessFootprint } from './schemas/access-footprint.schema'
import { User } from '../users/schemas/user.schema'

/*
 * This runs on every authenticated request, so the cost of a repeat matters as
 * much as the correctness of a first sighting. Values reaching the database
 * come from headers, so the shape of each update is asserted rather than only
 * the fact that one happened.
 */
describe('AccessFootprintService', () => {
  let service: AccessFootprintService
  let footprintModel: {
    updateOne: jest.Mock
    countDocuments: jest.Mock
  }
  let userModel: { updateOne: jest.Mock }

  const flush = () => new Promise((resolve) => setImmediate(resolve))

  function buildRequest(overrides: Record<string, any> = {}) {
    return {
      user: { _id: 'user-1', access: { addressesSeen: 3 } },
      ip: '203.0.113.9',
      originalUrl: '/api/v1/gateway/devices',
      headers: { 'user-agent': 'curl/8.4.0' },
      ...overrides,
    }
  }

  beforeEach(async () => {
    footprintModel = {
      updateOne: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
      countDocuments: jest.fn().mockResolvedValue(0),
    }
    userModel = { updateOne: jest.fn().mockResolvedValue({}) }

    const moduleRef = await Test.createTestingModule({
      providers: [
        AccessFootprintService,
        {
          provide: getModelToken(AccessFootprint.name),
          useValue: footprintModel,
        },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile()

    service = moduleRef.get(AccessFootprintService)
  })

  afterEach(() => {
    delete process.env.ACCESS_FOOTPRINTS
    delete process.env.TRUSTED_PROXY
  })

  it('records a first sighting and updates the account summary', async () => {
    process.env.TRUSTED_PROXY = 'cloudflare'
    service.record({
      request: buildRequest({
        headers: {
          'user-agent': 'curl/8.4.0',
          'cf-connecting-ip': '203.0.113.9',
          'cf-ipcountry': 'DE',
        },
        apiKey: { _id: 'key-1' },
      }),
    })
    await flush()

    expect(footprintModel.updateOne).toHaveBeenCalledTimes(1)
    const [filter, update, options] = footprintModel.updateOne.mock.calls[0]
    expect(filter).toEqual({
      user: 'user-1',
      channel: 'api',
      ip: '203.0.113.9',
    })
    expect(update.$setOnInsert.firstSeenAt).toBeInstanceOf(Date)
    expect(update.$set).toMatchObject({
      country: 'DE',
      client: 'curl',
      apiKey: 'key-1',
    })
    expect(options).toEqual({ upsert: true })

    expect(userModel.updateOne).toHaveBeenCalledTimes(1)
    const [, summary] = userModel.updateOne.mock.calls[0]
    expect(summary.$inc).toEqual({ 'access.addressesSeen': 1 })
    expect(summary.$addToSet).toEqual({
      'access.channels': 'api',
      'access.countries': 'DE',
    })
  })

  it('writes no empty values when the edge reports no region', async () => {
    service.record({ request: buildRequest() })
    await flush()

    const [, update] = footprintModel.updateOne.mock.calls[0]
    expect(update.$set).not.toHaveProperty('country')
    expect(Object.values(update.$set)).not.toContain(undefined)

    const [, summary] = userModel.updateOne.mock.calls[0]
    expect(summary.$addToSet).toEqual({ 'access.channels': 'api' })
  })

  it('writes nothing for a repeat from an origin already recorded', async () => {
    service.record({ request: buildRequest() })
    await flush()
    service.record({ request: buildRequest() })
    await flush()

    expect(footprintModel.updateOne).toHaveBeenCalledTimes(1)
  })

  it('separates the channels of one account', async () => {
    service.record({ request: buildRequest() })
    await flush()
    service.record({
      request: buildRequest({
        headers: {
          authorization: 'Bearer token',
          'user-agent': 'Mozilla/5.0 Chrome/127',
        },
      }),
    })
    await flush()

    expect(footprintModel.updateOne).toHaveBeenCalledTimes(2)
    expect(footprintModel.updateOne.mock.calls[1][0].channel).toBe('web')
    expect(footprintModel.updateOne.mock.calls[1][1].$set.client).toBe(
      'browser',
    )
  })

  it('records one origin per IPv6 network rather than per address', async () => {
    service.record({ request: buildRequest({ ip: '2001:db8:1:2:3:4:5:6' }) })
    await flush()
    service.record({ request: buildRequest({ ip: '2001:db8:1:2:aaaa::1' }) })
    await flush()

    expect(footprintModel.updateOne).toHaveBeenCalledTimes(1)
    expect(footprintModel.updateOne.mock.calls[0][0].ip).toBe(
      '2001:db8:1:2::/64',
    )
  })

  it('does not update the summary when the origin was already there', async () => {
    footprintModel.updateOne.mockResolvedValue({ upsertedCount: 0 })
    service.record({ request: buildRequest() })
    await flush()

    expect(footprintModel.updateOne).toHaveBeenCalledTimes(1)
    expect(userModel.updateOne).not.toHaveBeenCalled()
  })

  it('stops adding origins once an account reaches the ceiling', async () => {
    footprintModel.countDocuments.mockResolvedValue(1000)
    service.record({
      request: buildRequest({
        user: { _id: 'user-1', access: { addressesSeen: 1000 } },
      }),
    })
    await flush()

    expect(footprintModel.countDocuments).toHaveBeenCalledWith({
      user: 'user-1',
      channel: 'api',
    })
    expect(footprintModel.updateOne.mock.calls[0][2]).toEqual({ upsert: false })
  })

  it('keeps recording while the collection is below the ceiling', async () => {
    footprintModel.countDocuments.mockResolvedValue(12)
    service.record({
      request: buildRequest({
        user: { _id: 'user-1', access: { addressesSeen: 4000 } },
      }),
    })
    await flush()

    expect(footprintModel.updateOne.mock.calls[0][2]).toEqual({ upsert: true })
  })

  it('does not count a request twice when both guards run', async () => {
    const request = buildRequest()
    service.record({ request })
    service.record({ request })
    await flush()

    expect(footprintModel.updateOne).toHaveBeenCalledTimes(1)
  })

  it('records nothing when the recorder is switched off', async () => {
    process.env.ACCESS_FOOTPRINTS = 'off'
    service.record({ request: buildRequest() })
    await flush()

    expect(footprintModel.updateOne).not.toHaveBeenCalled()
  })

  it('records nothing for an unauthenticated request', async () => {
    service.record({ request: buildRequest({ user: undefined }) })
    await flush()

    expect(footprintModel.updateOne).not.toHaveBeenCalled()
  })

  it('records nothing when the address does not parse', async () => {
    service.record({ request: buildRequest({ ip: 'not-an-address' }) })
    await flush()

    expect(footprintModel.updateOne).not.toHaveBeenCalled()
  })

  it('swallows the clash when two first requests race', async () => {
    footprintModel.updateOne.mockRejectedValue({ code: 11000 })
    const warn = jest.spyOn(service['logger'], 'warn').mockImplementation()

    service.record({ request: buildRequest() })
    await flush()

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('retries the next request when a write fails', async () => {
    footprintModel.updateOne.mockRejectedValueOnce(new Error('no primary'))
    const warn = jest.spyOn(service['logger'], 'warn').mockImplementation()

    service.record({ request: buildRequest() })
    await flush()
    expect(warn).toHaveBeenCalled()

    footprintModel.updateOne.mockResolvedValue({ upsertedCount: 1 })
    service.record({ request: buildRequest() })
    await flush()

    expect(footprintModel.updateOne).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
