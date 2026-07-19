import { HttpException } from '@nestjs/common'
import { ExecutionContext } from '@nestjs/common'
import { CanModifyApiKey } from './can-modify-api-key.guard'
import { AuthService } from '../auth.service'
import { UserRole } from '../../users/user-roles.enum'

const VALID_ID = '507f1f77bcf86cd799439011'

const contextFor = (request: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext

describe('CanModifyApiKey', () => {
  let guard: CanModifyApiKey
  let authService: { findApiKeyById: jest.Mock }

  beforeEach(() => {
    authService = { findApiKeyById: jest.fn() }
    guard = new CanModifyApiKey(authService as unknown as AuthService)
  })

  it('allows the owner of the api key', async () => {
    authService.findApiKeyById.mockResolvedValue({ user: 'user_1' })
    const request = { params: { id: VALID_ID }, user: { id: 'user_1' } }

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true)
  })

  it('rejects a non-owner (cross-tenant access)', async () => {
    authService.findApiKeyById.mockResolvedValue({ user: 'owner' })
    const request = { params: { id: VALID_ID }, user: { id: 'attacker' } }

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      HttpException,
    )
  })

  it('allows an admin regardless of ownership', async () => {
    authService.findApiKeyById.mockResolvedValue({ user: 'owner' })
    const request = {
      params: { id: VALID_ID },
      user: { id: 'someone-else', role: UserRole.ADMIN },
    }

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true)
  })

  it('throws 400 for an invalid id', async () => {
    const request = { params: { id: 'not-an-objectid' }, user: { id: 'user_1' } }

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      HttpException,
    )
    expect(authService.findApiKeyById).not.toHaveBeenCalled()
  })

  it('rejects when the api key does not exist', async () => {
    authService.findApiKeyById.mockResolvedValue(null)
    const request = { params: { id: VALID_ID }, user: { id: 'user_1' } }

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      HttpException,
    )
  })
})
