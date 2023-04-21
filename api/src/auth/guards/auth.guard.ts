import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from 'src/users/users.service'
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
    var userId

    const request = context.switchToHttp().getRequest()
    if (request.headers.authorization?.startsWith('Bearer ')) {
      const bearerToken = request.headers.authorization.split(' ')[1]
      const payload = this.jwtService.verify(bearerToken)
      userId = payload.sub
    }

    // check apiKey in query params
    else if (request.query.apiKey) {
      const apiKeyStr = request.query.apiKey
      if (apiKeyStr) {
        var regex = new RegExp(`^${apiKeyStr.substr(0, 17)}`, 'g')
        const apiKey = await this.authService.findApiKey({
          apiKey: { $regex: regex },
        })

        if (apiKey && bcrypt.compareSync(apiKeyStr, apiKey.hashedApiKey)) {
          userId = apiKey.user
        }
      }
    }

    if (userId) {
      const user = await this.authService.validateUser(userId)
      if (user) {
        request.user = user
        return true
      }
    }

    throw new HttpException({ error: 'Unauthorized' }, HttpStatus.UNAUTHORIZED)
  }
}
