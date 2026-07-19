import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { HttpException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { MailService } from '../mail/mail.service'
import { TurnstileService } from '../common/turnstile.service'
import { ApiKey } from './schemas/api-key.schema'
import { PasswordReset } from './schemas/password-reset.schema'
import { AccessLog } from './schemas/access-log.schema'
import { EmailVerification } from './schemas/email-verification.schema'

// Regression tests for CWE-640 password reset OTP brute-force protection.
describe('AuthService.resetPassword — OTP brute-force protection', () => {
  let service: AuthService

  const buildUser = () =>
    ({
      _id: 'user-1',
      email: 'victim@example.com',
      password: 'existing-hash',
      save: jest.fn().mockResolvedValue(undefined),
    }) as any

  const buildResetDoc = async (rawOtp: string, overrides: any = {}) => {
    const doc: any = {
      user: 'user-1',
      otp: await bcrypt.hash(rawOtp, 4),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      ...overrides,
    }
    doc.save = jest.fn().mockImplementation(() => Promise.resolve(doc))
    return doc
  }

  const mockUsersService = { findOne: jest.fn() }
  const mockJwtService = { sign: jest.fn() }
  const mockMailService = { sendEmailFromTemplate: jest.fn() }
  const mockTurnstileService = { verify: jest.fn() }
  const mockPasswordResetModel = { findOne: jest.fn() }
  const emptyModel = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: TurnstileService, useValue: mockTurnstileService },
        { provide: getModelToken(ApiKey.name), useValue: emptyModel },
        {
          provide: getModelToken(PasswordReset.name),
          useValue: mockPasswordResetModel,
        },
        { provide: getModelToken(AccessLog.name), useValue: emptyModel },
        {
          provide: getModelToken(EmailVerification.name),
          useValue: emptyModel,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  it('locks out the reset record after 5 wrong OTP attempts (brute-force prevention)', async () => {
    const user = buildUser()
    const reset = await buildResetDoc('123456')
    mockUsersService.findOne.mockResolvedValue(user)
    mockPasswordResetModel.findOne.mockResolvedValue(reset)

    // 5 wrong attempts — each should be rejected. The 5th one must consume
    // the reset record so no further attempts (right OR wrong) can succeed.
    for (let i = 0; i < 5; i++) {
      await expect(
        service.resetPassword({
          email: user.email,
          otp: '000000',
          newPassword: 'a-new-password',
        }),
      ).rejects.toBeInstanceOf(HttpException)
    }

    // After the lockout, submitting the CORRECT otp must still be rejected —
    // the record has been invalidated by the failed-attempts counter.
    mockPasswordResetModel.findOne.mockResolvedValue(reset)
    await expect(
      service.resetPassword({
        email: user.email,
        otp: '123456',
        newPassword: 'a-new-password',
      }),
    ).rejects.toBeInstanceOf(HttpException)

    // Password must not have been rewritten by any of the above.
    expect(user.save).not.toHaveBeenCalled()
    // The reset record must have been persisted with attempts incremented
    // (i.e., the failed-attempt tracking is durable, not in-memory only).
    expect(reset.save).toHaveBeenCalled()
    expect(reset.attempts).toBeGreaterThanOrEqual(5)
  })

  it('accepts the correct OTP when attempts are below the limit', async () => {
    const user = buildUser()
    const reset = await buildResetDoc('654321', { attempts: 2 })
    mockUsersService.findOne.mockResolvedValue(user)
    mockPasswordResetModel.findOne.mockResolvedValue(reset)

    await expect(
      service.resetPassword({
        email: user.email,
        otp: '654321',
        newPassword: 'a-new-password',
      }),
    ).resolves.toEqual(expect.objectContaining({ message: expect.any(String) }))

    expect(user.save).toHaveBeenCalled()
  })

  it('rejects immediately if the record is already locked out (attempts >= limit)', async () => {
    const user = buildUser()
    const reset = await buildResetDoc('654321', { attempts: 5 })
    mockUsersService.findOne.mockResolvedValue(user)
    mockPasswordResetModel.findOne.mockResolvedValue(reset)

    await expect(
      service.resetPassword({
        email: user.email,
        otp: '654321', // correct OTP
        newPassword: 'a-new-password',
      }),
    ).rejects.toBeInstanceOf(HttpException)

    expect(user.save).not.toHaveBeenCalled()
  })
})
