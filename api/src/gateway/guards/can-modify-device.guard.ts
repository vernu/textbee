import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { UserRole } from 'src/users/user-roles.enum'
import { GatewayService } from '../gateway.service'

@Injectable()
export class CanModifyDevice implements CanActivate {
  constructor(private gatewayService: GatewayService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const deviceId = request.params.id
    const userId = request.user?.id

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
