import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import mongoose from 'mongoose'
import { UserRole } from '../../users/user-roles.enum'
import { GatewayService } from '../gateway.service'

@Injectable()
export class CanModifyDevice implements CanActivate {
  constructor(private gatewayService: GatewayService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const deviceId = request.params.id
    const userId = request.user?.id

    const isValidId = mongoose.Types.ObjectId.isValid(deviceId)
    if (!isValidId) {
      throw new HttpException(
        { error: 'Invalid device id' },
        HttpStatus.BAD_REQUEST,
      )
    }

    const device = await this.gatewayService.getDeviceById(deviceId)
    if (
      !!userId &&
      (device?.user == userId.toString() ||
        request.user?.role == UserRole.ADMIN)
    ) {
      return true
    }

    throw new HttpException({ error: 'Unauthorized' }, HttpStatus.UNAUTHORIZED)
  }
}
