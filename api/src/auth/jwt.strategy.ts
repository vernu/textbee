import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { User } from '../users/schemas/user.schema'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    })
  }

  async validate(payload: any): Promise<User> {
    const userId = payload.sub
    const user = await this.usersService.findOne({ _id: userId })
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }
    return user
  }
}
