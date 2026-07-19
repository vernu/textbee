import { HttpException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { AuthService } from './auth.service'

// AuthService takes eight constructor deps. Only the ones a given flow
// touches are given real behaviour; the rest are inert stubs.
const build = () => {
  let lastApiKeyDoc: any

  const apiKeyModel: any = jest.fn().mockImplementation((doc: any) => {
    lastApiKeyDoc = { ...doc, save: jest.fn().mockResolvedValue(undefined) }
    return lastApiKeyDoc
  })
  apiKeyModel.findOne = jest.fn()
  apiKeyModel.findById = jest.fn()

  const usersService = {
    findOne: jest.fn(),
    findOneWithPassword: jest.fn(),
    create: jest.fn(),
  }
  const passwordResetModel = { findOne: jest.fn() }
  const mailService = { sendEmailFromTemplate: jest.fn().mockResolvedValue(undefined) }
  const jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') }
  const turnstileService = { verify: jest.fn().mockResolvedValue(undefined) }

  const service = new AuthService(
    usersService as any,
    jwtService as any,
    apiKeyModel,
    passwordResetModel as any,
    {} as any, // accessLogModel
    {} as any, // emailVerificationModel
    mailService as any,
    turnstileService as any,
  )

  return {
    service,
    apiKeyModel,
    usersService,
    passwordResetModel,
    mailService,
    jwtService,
    turnstileService,
    getLastApiKeyDoc: () => lastApiKeyDoc,
  }
}

describe('AuthService', () => {
  describe('validateEmail', () => {
    it('accepts a well-formed address', async () => {
      const { service } = build()
      await expect(service.validateEmail('a@b.com')).resolves.toBeUndefined()
    })

    it.each(['plainaddress', 'no-at-sign.com', 'missing@dot', '@no-local.com'])(
      'rejects %s',
      async (bad) => {
        const { service } = build()
        await expect(service.validateEmail(bad)).rejects.toThrow(HttpException)
      },
    )
  })

  describe('validatePassword', () => {
    it('rejects a password shorter than 6 characters', async () => {
      const { service } = build()
      await expect(service.validatePassword('12345')).rejects.toThrow(HttpException)
    })

    it('accepts the 6 and 128 character boundaries', async () => {
      const { service } = build()
      await expect(service.validatePassword('123456')).resolves.toBeUndefined()
      await expect(service.validatePassword('a'.repeat(128))).resolves.toBeUndefined()
    })

    it('rejects a password longer than 128 characters', async () => {
      const { service } = build()
      await expect(service.validatePassword('a'.repeat(129))).rejects.toThrow(
        HttpException,
      )
    })
  })

  describe('generateApiKey', () => {
    it('returns a raw key and persists only a masked value plus a bcrypt hash', async () => {
      const { service, getLastApiKeyDoc } = build()

      const result = await service.generateApiKey({ _id: 'user_1' } as any)

      expect(typeof result.apiKey).toBe('string')
      const doc = getLastApiKeyDoc()
      // The stored apiKey is masked: it must not be the raw key.
      expect(doc.apiKey).not.toBe(result.apiKey)
      expect(doc.apiKey.endsWith('*'.repeat(18))).toBe(true)
      expect(doc.apiKey.startsWith(result.apiKey.substr(0, 17))).toBe(true)
      // The stored hash is a bcrypt hash of the raw key, never the raw key.
      expect(doc.hashedApiKey).not.toBe(result.apiKey)
      expect(bcrypt.compareSync(result.apiKey, doc.hashedApiKey)).toBe(true)
      expect(doc.user).toBe('user_1')
      expect(doc.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('findActiveApiKeyByClientKey', () => {
    const revokedClause = {
      $or: [{ revokedAt: null }, { revokedAt: { $exists: false } }],
    }

    it('resolves via the exact masked match when one exists', async () => {
      const { service, apiKeyModel } = build()
      const hit = { apiKey: 'masked', user: 'user_1' }
      apiKeyModel.findOne.mockResolvedValueOnce(hit)

      const raw = 'abcdefghijklmnopqrstuvwxyz'
      const found = await service.findActiveApiKeyByClientKey(raw)

      expect(found).toBe(hit)
      expect(apiKeyModel.findOne).toHaveBeenCalledTimes(1)
      expect(apiKeyModel.findOne).toHaveBeenCalledWith({
        apiKey: `${raw.substring(0, 17)}${'*'.repeat(18)}`,
        ...revokedClause,
      })
    })

    it('falls back to a prefix regex when there is no masked match', async () => {
      const { service, apiKeyModel } = build()
      const hit = { apiKey: 'legacy', user: 'user_1' }
      apiKeyModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(hit)

      const raw = 'abcdefghijklmnopqrstuvwxyz'
      const found = await service.findActiveApiKeyByClientKey(raw)

      expect(found).toBe(hit)
      expect(apiKeyModel.findOne).toHaveBeenCalledTimes(2)
      const fallbackArg = apiKeyModel.findOne.mock.calls[1][0]
      expect(fallbackArg.apiKey.$regex).toBeInstanceOf(RegExp)
      // A legitimate prefix matches its own masked value.
      expect(fallbackArg.apiKey.$regex.test(raw.substring(0, 17))).toBe(true)
      // The revoked-key exclusion is applied on both lookups.
      expect(fallbackArg.$or).toEqual(revokedClause.$or)
    })
  })

  describe('changePassword', () => {
    const withOldPassword = async (old: string) => {
      const ctx = build()
      const stored = {
        _id: 'user_1',
        password: bcrypt.hashSync(old, 10),
        save: jest.fn().mockResolvedValue(undefined),
      }
      ctx.usersService.findOneWithPassword.mockResolvedValue(stored)
      return { ...ctx, stored }
    }

    it('rejects a wrong old password without saving', async () => {
      const { service, stored } = await withOldPassword('correct-old')

      await expect(
        service.changePassword(
          { oldPassword: 'wrong', newPassword: 'a-brand-new-password' },
          { _id: 'user_1' } as any,
        ),
      ).rejects.toThrow(HttpException)
      expect(stored.save).not.toHaveBeenCalled()
    })

    it('updates the hash on success', async () => {
      const { service, stored } = await withOldPassword('correct-old')
      const before = stored.password

      await service.changePassword(
        { oldPassword: 'correct-old', newPassword: 'a-brand-new-password' },
        { _id: 'user_1' } as any,
      )

      expect(stored.save).toHaveBeenCalledTimes(1)
      expect(stored.password).not.toBe(before)
      expect(bcrypt.compareSync('a-brand-new-password', stored.password)).toBe(true)
    })
  })

  describe('register input validation', () => {
    const registerSetup = () => {
      const ctx = build()
      ctx.usersService.findOne.mockResolvedValue(null) // no existing user
      // If validation is (incorrectly) skipped, register would reach create;
      // return a usable doc so the pre-fix path resolves rather than erroring.
      ctx.usersService.create.mockResolvedValue({
        _id: 'user_1',
        email: 'x',
        lastLoginAt: null,
        save: jest.fn().mockResolvedValue(undefined),
        toObject: () => ({ _id: 'user_1' }),
      })
      return ctx
    }

    it('rejects a malformed email and does not create the user', async () => {
      const { service, usersService } = registerSetup()

      await expect(
        service.register({
          name: 'Ada',
          email: 'not-an-email',
          password: 'a-valid-password',
          turnstileToken: 'token',
        }),
      ).rejects.toThrow(HttpException)
      expect(usersService.create).not.toHaveBeenCalled()
    })

    it('rejects a too-short password and does not create the user', async () => {
      const { service, usersService } = registerSetup()

      await expect(
        service.register({
          name: 'Ada',
          email: 'a@b.com',
          password: '123',
          turnstileToken: 'token',
        }),
      ).rejects.toThrow(HttpException)
      expect(usersService.create).not.toHaveBeenCalled()
    })

    it('creates the user when email and password are valid', async () => {
      const { service, usersService } = registerSetup()

      await service.register({
        name: 'Ada',
        email: 'a@b.com',
        password: 'a-valid-password',
        turnstileToken: 'token',
      })
      expect(usersService.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('changePassword input validation', () => {
    it('rejects a too-short new password without saving', async () => {
      const ctx = build()
      const stored = {
        _id: 'user_1',
        password: bcrypt.hashSync('correct-old', 10),
        save: jest.fn().mockResolvedValue(undefined),
      }
      ctx.usersService.findOneWithPassword.mockResolvedValue(stored)

      await expect(
        ctx.service.changePassword(
          { oldPassword: 'correct-old', newPassword: '123' },
          { _id: 'user_1' } as any,
        ),
      ).rejects.toThrow(HttpException)
      expect(stored.save).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    const setup = () => {
      const ctx = build()
      const user = {
        _id: 'user_1',
        email: 'a@b.com',
        name: 'Ada',
        password: 'old-hash',
        save: jest.fn().mockResolvedValue(undefined),
      }
      ctx.usersService.findOne.mockResolvedValue(user)
      return { ...ctx, user }
    }

    it('rejects when there is no valid reset record', async () => {
      const { service, passwordResetModel, user } = setup()
      passwordResetModel.findOne.mockResolvedValue(null)

      await expect(
        service.resetPassword({ email: 'a@b.com', otp: '1234', newPassword: 'new-password' }),
      ).rejects.toThrow(HttpException)
      expect(user.save).not.toHaveBeenCalled()
    })

    it('rejects when the OTP does not match', async () => {
      const { service, passwordResetModel, user } = setup()
      passwordResetModel.findOne.mockResolvedValue({
        otp: bcrypt.hashSync('9999', 10),
        save: jest.fn(),
      })

      await expect(
        service.resetPassword({ email: 'a@b.com', otp: '1234', newPassword: 'new-password' }),
      ).rejects.toThrow(HttpException)
      expect(user.save).not.toHaveBeenCalled()
    })

    it('updates the password and expires the reset on success', async () => {
      const { service, passwordResetModel, user } = setup()
      const reset = {
        otp: bcrypt.hashSync('1234', 10),
        expiresAt: new Date(Date.now() + 60_000),
        save: jest.fn().mockResolvedValue(undefined),
      }
      passwordResetModel.findOne.mockResolvedValue(reset)

      const res = await service.resetPassword({
        email: 'a@b.com',
        otp: '1234',
        newPassword: 'new-password',
      })

      expect(user.save).toHaveBeenCalledTimes(1)
      expect(bcrypt.compareSync('new-password', user.password)).toBe(true)
      expect(reset.save).toHaveBeenCalledTimes(1)
      // The reset window is closed (expiry moved to now or earlier).
      expect(reset.expiresAt.getTime()).toBeLessThanOrEqual(Date.now())
      expect(res.message).toMatch(/reset/i)
    })
  })
})
