import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../../users/users.service'
import { AuthService } from '../auth.service'
import * as bcrypt from 'bcryptjs'

@Injectable()
// Guard for authenticating users by either jwt token or api key
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    let userId
    const apiKeyString = request.headers['x-api-key'] || request.query.apiKey
    if (request.headers.authorization?.startsWith('Bearer ')) {
      const bearerToken = request.headers.authorization.split(' ')[1]
      try {
        const payload = this.jwtService.verify(bearerToken)
        userId = payload.sub
      } catch (e) {
        throw new HttpException(
          { error: 'Unauthorized' },
          HttpStatus.UNAUTHORIZED,
        )
      }
    } else if (apiKeyString) {
      const regex = new RegExp(`^${apiKeyString.substr(0, 17)}`, 'g')
      const apiKey = await this.authService.findApiKey({
        apiKey: { $regex: regex },
      })

      if (apiKey && bcrypt.compareSync(apiKeyString, apiKey.hashedApiKey)) {
        userId = apiKey.user
        request.apiKey = apiKey
      }
    }

    if (userId) {
      const user = await this.usersService.findOne({ _id: userId })
      if (user) {
        request.user = user
        this.authService.trackAccessLog({ request })
        return true
      }
    }

    throw new HttpException({ error: 'Unauthorized' }, HttpStatus.UNAUTHORIZED)
  }
}
