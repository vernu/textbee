import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import mongoose from 'mongoose'
import { UserRole } from '../../users/user-roles.enum'
import { AuthService } from '../auth.service'

@Injectable()
export class CanModifyApiKey implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const apiKeyId = request.params.id
    const userId = request.user?.id

    const isValidId = mongoose.Types.ObjectId.isValid(apiKeyId)
    if (!isValidId) {
      throw new HttpException({ error: 'Invalid id' }, HttpStatus.BAD_REQUEST)
    }

    const apiKey = await this.authService.findApiKeyById(apiKeyId)


    if (
      !!userId &&
      (apiKey?.user == userId.toString() ||
        request.user?.role == UserRole.ADMIN)
    ) {
      return true
    }

    throw new HttpException({ error: 'Unauthorized' }, HttpStatus.UNAUTHORIZED)
  }
}
