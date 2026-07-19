import { HttpException } from '@nestjs/common'
import { ExecutionContext } from '@nestjs/common'
import { CanModifyDevice } from './can-modify-device.guard'
import { GatewayService } from '../gateway.service'
import { UserRole } from '../../users/user-roles.enum'

const VALID_ID = '507f1f77bcf86cd799439011'

const contextFor = (request: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext

describe('CanModifyDevice', () => {
  let guard: CanModifyDevice
  let gatewayService: { getDeviceById: jest.Mock }

  beforeEach(() => {
    gatewayService = { getDeviceById: jest.fn() }
    guard = new CanModifyDevice(gatewayService as unknown as GatewayService)
  })

  it('allows the owner of the device', async () => {
    gatewayService.getDeviceById.mockResolvedValue({ user: 'user_1' })
    const request = { params: { id: VALID_ID }, user: { id: 'user_1' } }

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true)
  })

  it('rejects a non-owner (cross-tenant access)', async () => {
    gatewayService.getDeviceById.mockResolvedValue({ user: 'owner' })
    const request = { params: { id: VALID_ID }, user: { id: 'attacker' } }

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      HttpException,
    )
  })

  it('allows an admin regardless of ownership', async () => {
    gatewayService.getDeviceById.mockResolvedValue({ user: 'owner' })
    const request = {
      params: { id: VALID_ID },
      user: { id: 'someone-else', role: UserRole.ADMIN },
    }

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true)
  })

  it('throws 400 for an invalid device id', async () => {
    const request = { params: { id: 'not-an-objectid' }, user: { id: 'user_1' } }

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      HttpException,
    )
    expect(gatewayService.getDeviceById).not.toHaveBeenCalled()
  })

  it('rejects when the device does not exist', async () => {
    gatewayService.getDeviceById.mockResolvedValue(null)
    const request = { params: { id: VALID_ID }, user: { id: 'user_1' } }

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      HttpException,
    )
  })
})
