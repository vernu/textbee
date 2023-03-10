import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { InjectModel } from '@nestjs/mongoose'
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema'
import { Model } from 'mongoose'
import { User } from 'src/users/schemas/user.schema'
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  async validateUser(_id: string): Promise<User | null> {
    const user = await this.usersService.findOne({ _id })
    if (user) {
      return user
    }
    return null
  }

  async login(userData: any) {
    const user = await this.usersService.findOne({ email: userData.email })
    if (!user) {
      throw new HttpException(
        { error: 'User not found' },
        HttpStatus.UNAUTHORIZED,
      )
    }

    if (!(await bcrypt.compare(userData.password, user.password))) {
      throw new HttpException(
        { error: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      )
    }

    const payload = { email: user.email, sub: user._id }
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }

  async register(userData: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const user = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    })

    const payload = { email: user.email, sub: user._id }

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }

  async generateApiKey(currentUser: User) {
    const apiKey = uuidv4()
    const hashedApiKey = await bcrypt.hash(apiKey, 10)

    const newApiKey = new this.apiKeyModel({
      apiKey: apiKey.substr(0, 17) + '******************',
      hashedApiKey,
      user: currentUser._id,
    })

    await newApiKey.save()

    return { apiKey, message: 'Save this key, it wont be shown again ;)' }
  }

  async getUserApiKeys(currentUser: User) {
    return this.apiKeyModel.find({ user: currentUser._id })
  }

  async findApiKeys(params) {
    return this.apiKeyModel.findOne(params)
  }

  async deleteApiKey(apiKeyId: string) {
    const apiKey = await this.apiKeyModel.findOne({ _id: apiKeyId })
    if (!apiKey) {
      throw new HttpException(
        {
          error: 'Api key not found',
        },
        HttpStatus.NOT_FOUND,
      )
    }

    await this.apiKeyModel.deleteOne({ _id: apiKeyId })
  }
}
