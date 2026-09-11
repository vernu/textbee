import { HttpException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import axios from 'axios'
import { AuthService } from './auth.service'

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

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
  apiKeyModel.updateOne = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(undefined),
  })

  const usersService = {
    findOne: jest.fn(),
    findOneWithPassword: jest.fn(),
    create: jest.fn(),
    markMilestone: jest.fn().mockResolvedValue(false),
  }
  const passwordResetModel = { findOne: jest.fn(), findOneAndUpdate: jest.fn() }
  const mailService = { sendEmailFromTemplate: jest.fn().mockResolvedValue(undefined) }
  const jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') }
  const turnstileService = { verify: jest.fn().mockResolvedValue(undefined) }
  const analyticsService = {
    userRegistered: jest.fn(),
    checkoutStarted: jest.fn(),
    purchase: jest.fn(),
  }

  const service = new AuthService(
    usersService as any,
    jwtService as any,
    apiKeyModel,
    passwordResetModel as any,
    {} as any, // accessLogModel
    {} as any, // emailVerificationModel
    mailService as any,
    turnstileService as any,
    analyticsService as any,
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

    it('issues prefixed base62 keys that differ between calls', async () => {
      const { service } = build()

      const first = await service.generateApiKey({ _id: 'user_1' } as any)
      const second = await service.generateApiKey({ _id: 'user_1' } as any)

      expect(first.apiKey).toMatch(/^txb_[A-Za-z0-9]{32}$/)
      expect(second.apiKey).toMatch(/^txb_[A-Za-z0-9]{32}$/)
      expect(first.apiKey).not.toBe(second.apiKey)
    })

    it('stores the sha256 lookup hash of the raw key', async () => {
      const { service, getLastApiKeyDoc } = build()

      const result = await service.generateApiKey({ _id: 'user_1' } as any)

      const doc = getLastApiKeyDoc()
      expect(doc.hashedApiKeySha256).toBe(sha256(result.apiKey))
      expect(doc.hashedApiKeySha256).not.toBe(result.apiKey)
    })
  })

  describe('verifyApiKey', () => {
    const raw = 'txb_' + 'a'.repeat(32)

    it('resolves through the sha256 index without touching bcrypt', async () => {
      const { service, apiKeyModel } = build()
      const stored = { _id: 'key_1', user: 'user_1', revokedAt: null }
      apiKeyModel.findOne.mockResolvedValueOnce(stored)
      const compare = jest.spyOn(bcrypt, 'compare')

      await expect(service.verifyApiKey(raw)).resolves.toBe(stored)
      expect(apiKeyModel.findOne).toHaveBeenCalledTimes(1)
      expect(apiKeyModel.findOne).toHaveBeenCalledWith({
        hashedApiKeySha256: sha256(raw),
      })
      expect(compare).not.toHaveBeenCalled()
    })

    it('rejects a revoked key on the fast path without a legacy lookup', async () => {
      const { service, apiKeyModel } = build()
      apiKeyModel.findOne.mockResolvedValueOnce({
        _id: 'key_1',
        user: 'user_1',
        revokedAt: new Date(),
      })

      await expect(service.verifyApiKey(raw)).resolves.toBeNull()
      // Only the sha256 lookup ran: no masked or regex fallback query.
      expect(apiKeyModel.findOne).toHaveBeenCalledTimes(1)
    })

    it('verifies a legacy bcrypt-only key and backfills its sha256 hash', async () => {
      const { service, apiKeyModel } = build()
      const legacy = {
        _id: 'key_legacy',
        user: 'user_1',
        hashedApiKey: bcrypt.hashSync(raw, 4),
      }
      apiKeyModel.findOne
        .mockResolvedValueOnce(null) // sha256 miss
        .mockResolvedValueOnce(legacy) // masked hit

      await expect(service.verifyApiKey(raw)).resolves.toBe(legacy)
      expect(apiKeyModel.updateOne).toHaveBeenCalledWith(
        { _id: 'key_legacy' },
        { $set: { hashedApiKeySha256: sha256(raw) } },
      )
    })

    it('still authenticates when the backfill write fails', async () => {
      const { service, apiKeyModel } = build()
      const legacy = {
        _id: 'key_legacy',
        user: 'user_1',
        hashedApiKey: bcrypt.hashSync(raw, 4),
      }
      apiKeyModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(legacy)
      apiKeyModel.updateOne.mockReturnValueOnce({
        exec: jest.fn().mockRejectedValue(new Error('mongo down')),
      })

      await expect(service.verifyApiKey(raw)).resolves.toBe(legacy)
    })

    it('rejects a key that shares a masked prefix but not the secret body', async () => {
      const { service, apiKeyModel } = build()
      const otherKey = 'txb_' + 'a'.repeat(13) + 'b'.repeat(19)
      const collidingDoc = {
        _id: 'key_other',
        user: 'user_2',
        hashedApiKey: bcrypt.hashSync(otherKey, 4),
      }
      apiKeyModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(collidingDoc)

      // Same first 17 characters, so the masked lookup finds the wrong document.
      expect(otherKey.substring(0, 17)).toBe(raw.substring(0, 17))
      await expect(service.verifyApiKey(raw)).resolves.toBeNull()
      expect(apiKeyModel.updateOne).not.toHaveBeenCalled()
    })

    it('resolves a legacy lookup whose stored mask is already in the new format', async () => {
      const { service, apiKeyModel } = build()
      const legacy = {
        _id: 'key_new_format',
        apiKey: `${raw.substring(0, 17)}${'*'.repeat(18)}`,
        user: 'user_1',
        hashedApiKey: bcrypt.hashSync(raw, 4),
      }
      apiKeyModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(legacy)

      await expect(service.verifyApiKey(raw)).resolves.toBe(legacy)
    })

    it('returns null for an unknown key', async () => {
      const { service, apiKeyModel } = build()
      apiKeyModel.findOne.mockResolvedValue(null)

      await expect(service.verifyApiKey(raw)).resolves.toBeNull()
    })

    it('returns null for a missing or non-string key without querying', async () => {
      const { service, apiKeyModel } = build()

      await expect(service.verifyApiKey(undefined as any)).resolves.toBeNull()
      await expect(service.verifyApiKey('')).resolves.toBeNull()
      expect(apiKeyModel.findOne).not.toHaveBeenCalled()
    })

    // request.query.apiKey is attacker-controlled and need not be a string.
    // Without the type guard these would reach findOne as query operators.
    it.each([
      [{ $ne: null }],
      [{ $gt: '' }],
      [{ $regex: '.*' }],
      [['a', 'b']],
      [[]],
      [{}],
      [0],
      [true],
      [null],
    ])('rejects non-string payload %p without querying', async (payload) => {
      const { service, apiKeyModel } = build()

      await expect(service.verifyApiKey(payload as any)).resolves.toBeNull()
      expect(apiKeyModel.findOne).not.toHaveBeenCalled()
    })

    it('rejects a revoked legacy key and does not backfill it', async () => {
      const { service, apiKeyModel } = build()
      apiKeyModel.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        _id: 'key_legacy',
        user: 'user_1',
        hashedApiKey: bcrypt.hashSync(raw, 4),
        revokedAt: new Date(),
      })

      await expect(service.verifyApiKey(raw)).resolves.toBeNull()
      expect(apiKeyModel.updateOne).not.toHaveBeenCalled()
    })

    afterEach(() => jest.restoreAllMocks())
  })

  describe('getUserApiKeys', () => {
    it('excludes both credential digests from the projection', async () => {
      const { service, apiKeyModel } = build()
      apiKeyModel.find = jest.fn().mockResolvedValue([])

      await service.getUserApiKeys({ _id: 'user_1' } as any)

      const projection = apiKeyModel.find.mock.calls[0][1]
      expect(projection).toContain('-hashedApiKey')
      expect(projection).toContain('-hashedApiKeySha256')
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

    it('does not throw when the key contains regex metacharacters', async () => {
      const { service, apiKeyModel } = build()
      apiKeyModel.findOne.mockResolvedValue(null) // no masked hit -> regex fallback

      const raw = '((((' + 'x'.repeat(20)
      await expect(service.findActiveApiKeyByClientKey(raw)).resolves.toBeNull()

      // The prefix is escaped before it reaches the RegExp, so the parens are
      // literal and the pattern compiles instead of throwing SyntaxError.
      const fallbackArg = apiKeyModel.findOne.mock.calls[1][0]
      expect(fallbackArg.apiKey.$regex.source).toContain('\\(')
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

    const MAX_ATTEMPTS = 5

    const buildReset = (rawOtp: string, attempts = 0) => ({
      _id: 'reset_1',
      otp: bcrypt.hashSync(rawOtp, 10),
      expiresAt: new Date(Date.now() + 60_000),
      attempts,
      save: jest.fn().mockResolvedValue(undefined),
    })

    // The service reads the newest record, then claims an attempt against it
    // with an atomic findOneAndUpdate. This models that server-side guard:
    // no match once the record is at the cap, otherwise increment and return.
    const stageReset = (ctx: ReturnType<typeof setup>, reset: any) => {
      ctx.passwordResetModel.findOne.mockResolvedValue(reset)
      ctx.passwordResetModel.findOneAndUpdate.mockImplementation(async () => {
        if (reset.attempts >= MAX_ATTEMPTS) return null
        reset.attempts += 1
        return reset
      })
    }

    const submit = (ctx: ReturnType<typeof setup>, otp: string) =>
      ctx.service.resetPassword({
        email: 'a@b.com',
        otp,
        newPassword: 'new-password',
      })

    it('rejects when there is no valid reset record', async () => {
      const ctx = setup()
      ctx.passwordResetModel.findOne.mockResolvedValue(null)

      await expect(submit(ctx, '1234')).rejects.toThrow(HttpException)
      expect(ctx.user.save).not.toHaveBeenCalled()
    })

    it('rejects when the OTP does not match', async () => {
      const ctx = setup()
      stageReset(ctx, buildReset('9999'))

      await expect(submit(ctx, '1234')).rejects.toThrow(HttpException)
      expect(ctx.user.save).not.toHaveBeenCalled()
    })

    it('updates the password and expires the reset on success', async () => {
      const ctx = setup()
      const reset = buildReset('1234')
      stageReset(ctx, reset)

      const res = await submit(ctx, '1234')

      expect(ctx.user.save).toHaveBeenCalledTimes(1)
      expect(bcrypt.compareSync('new-password', ctx.user.password)).toBe(true)
      expect(reset.save).toHaveBeenCalledTimes(1)
      // The reset window is closed (expiry moved to now or earlier).
      expect(reset.expiresAt.getTime()).toBeLessThanOrEqual(Date.now())
      expect(res.message).toMatch(/reset/i)
    })

    it('locks the record out after 5 wrong OTPs, including against the correct one', async () => {
      const ctx = setup()
      const reset = buildReset('1234')
      stageReset(ctx, reset)

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await expect(submit(ctx, '0000')).rejects.toThrow(HttpException)
      }
      // The correct OTP must not rescue an exhausted record.
      await expect(submit(ctx, '1234')).rejects.toThrow(HttpException)

      expect(ctx.user.save).not.toHaveBeenCalled()
      expect(reset.attempts).toBe(MAX_ATTEMPTS)
    })

    it('rejects the correct OTP when the record is already at the cap', async () => {
      const ctx = setup()
      stageReset(ctx, buildReset('1234', MAX_ATTEMPTS))

      await expect(submit(ctx, '1234')).rejects.toThrow(HttpException)
      expect(ctx.user.save).not.toHaveBeenCalled()
    })

    it('claims each attempt atomically so parallel guesses cannot bypass the cap', async () => {
      const ctx = setup()
      stageReset(ctx, buildReset('1234'))

      await expect(submit(ctx, '0000')).rejects.toThrow(HttpException)

      // A read-modify-write counter would let concurrent requests all observe
      // the same count, so the increment has to happen in the query itself.
      const [filter, update] =
        ctx.passwordResetModel.findOneAndUpdate.mock.calls[0]
      expect(update).toEqual({ $inc: { attempts: 1 } })
      expect(filter._id).toBe('reset_1')
      expect(filter.$or).toEqual([
        { attempts: { $lt: MAX_ATTEMPTS } },
        { attempts: { $exists: false } },
      ])
    })

    it('reports an unknown address the same way as a bad code', async () => {
      const ctx = build()
      ctx.usersService.findOne.mockResolvedValue(null)

      await expect(
        ctx.service.resetPassword({
          email: 'nobody@b.com',
          otp: '123456',
          newPassword: 'Str0ng!pass',
        } as any),
      ).rejects.toMatchObject({
        response: { error: 'Invalid OTP' },
        status: 400,
      })
    })

    it('does not pass a non-string email to the user lookup', async () => {
      const ctx = build()

      await expect(
        ctx.service.resetPassword({
          email: { $ne: null } as any,
          otp: '123456',
          newPassword: 'Str0ng!pass',
        } as any),
      ).rejects.toThrow(HttpException)
      expect(ctx.usersService.findOne).not.toHaveBeenCalled()
    })
  })

  // tokeninfo only proves Google signed the token. Without these checks a token
  // minted for any other Google OAuth client would be accepted.
  describe('loginWithGoogle', () => {
    const ORIGINAL_ENV = process.env.GOOGLE_CLIENT_ID
    const OURS = 'our-client-id.apps.googleusercontent.com'

    const stageTokenInfo = (data: any) => {
      jest.spyOn(axios, 'get').mockResolvedValue({ data } as any)
    }

    beforeEach(() => {
      process.env.GOOGLE_CLIENT_ID = OURS
    })

    afterEach(() => {
      process.env.GOOGLE_CLIENT_ID = ORIGINAL_ENV
      jest.restoreAllMocks()
    })

    it('rejects a token minted for a different OAuth client', async () => {
      const ctx = build()
      stageTokenInfo({
        aud: 'someone-elses-client.apps.googleusercontent.com',
        email: 'victim@example.com',
        email_verified: 'true',
        sub: 'g1',
      })

      await expect(ctx.service.loginWithGoogle('tok')).rejects.toThrow(
        HttpException,
      )
      expect(ctx.usersService.findOne).not.toHaveBeenCalled()
    })

    it('rejects a token whose email is not verified', async () => {
      const ctx = build()
      stageTokenInfo({
        aud: OURS,
        email: 'victim@example.com',
        email_verified: 'false',
        sub: 'g1',
      })

      await expect(ctx.service.loginWithGoogle('tok')).rejects.toThrow(
        HttpException,
      )
      expect(ctx.usersService.findOne).not.toHaveBeenCalled()
    })

    it('accepts our own audience with a verified email', async () => {
      const ctx = build()
      stageTokenInfo({
        aud: OURS,
        email: 'ada@example.com',
        email_verified: 'true',
        sub: 'g1',
        name: 'Ada',
      })
      ctx.usersService.findOne.mockResolvedValue({
        _id: 'user_1',
        email: 'ada@example.com',
        save: jest.fn().mockResolvedValue(undefined),
        toObject: () => ({ _id: 'user_1', email: 'ada@example.com' }),
      })

      const result = await ctx.service.loginWithGoogle('tok')

      expect(result.accessToken).toBe('signed-jwt')
    })
  })
})
