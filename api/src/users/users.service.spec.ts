import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { UsersService } from './users.service'
import { User } from './schemas/user.schema'

describe('UsersService - signup attribution', () => {
  let service: UsersService
  const saved: any[] = []

  // A constructor-shaped mock, because create() does `new this.userModel(...)`.
  function UserModel(this: any, doc: any) {
    Object.assign(this, doc)
    this.save = jest.fn().mockResolvedValue(this)
    saved.push(this)
  }
  ;(UserModel as any).findOne = jest.fn()
  ;(UserModel as any).updateOne = jest.fn()

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: UserModel },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    saved.length = 0
    jest.clearAllMocks()
    ;(UserModel as any).findOne.mockResolvedValue(null)
  })

  it('records the normalised source and device at signup', async () => {
    await service.create({
      name: 'Ada',
      email: 'ada@example.com',
      attribution: { first: { source: 'meta', campaign: 'c1' } },
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
    })

    expect(saved[0]).toMatchObject({
      signupSource: 'meta',
      signupDevice: 'android',
      attribution: { first: { source: 'meta', campaign: 'c1' } },
    })
  })

  it('falls back to direct rather than leaving the source blank', async () => {
    await service.create({ name: 'Ada', email: 'ada@example.com' })

    expect(saved[0].signupSource).toBe('direct')
    expect(saved[0].signupDevice).toBe('other')
  })

  it('defaults the marketing opt in to false', async () => {
    await service.create({ name: 'Ada', email: 'ada@example.com' })
    expect(saved[0].marketingOptIn).toBe(false)

    await service.create({
      name: 'Ada',
      email: 'ada@example.com',
      marketingOptIn: true,
    })
    expect(saved[1].marketingOptIn).toBe(true)
  })
})

describe('UsersService - markMilestone', () => {
  let service: UsersService
  const userModel = { updateOne: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    jest.clearAllMocks()
  })

  it('only writes when the milestone is not already set', async () => {
    userModel.updateOne.mockResolvedValue({ modifiedCount: 1 })

    await service.markMilestone('user-1', 'firstSmsAt')

    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: 'user-1', 'milestones.firstSmsAt': { $exists: false } },
      { $set: { 'milestones.firstSmsAt': expect.any(Date) } },
    )
  })

  it('reports true once and false afterwards, so callers fire one event', async () => {
    userModel.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
    expect(await service.markMilestone('user-1', 'firstPaidAt')).toBe(true)

    userModel.updateOne.mockResolvedValueOnce({ modifiedCount: 0 })
    expect(await service.markMilestone('user-1', 'firstPaidAt')).toBe(false)
  })
})
