import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User, UserDocument } from './schemas/user.schema'
import { Model } from 'mongoose'

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(params) {
    return await this.userModel.findOne(params)
  }

  async findAll() {
    return await this.userModel.find()
  }

  async create({
    name,
    email,
    password,
    phone,
  }: {
    name: string
    email: string
    password?: string
    phone?: string
  }) {
    if (await this.findOne({ email })) {
      throw new HttpException(
        {
          error: 'user exists with the same email',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const newUser = new this.userModel({
      name,
      email,
      password,
      phone,
    })
    return await newUser.save()
  }

  async updateProfile(
    input: { name: string; phone: string },
    user: UserDocument,
  ) {
    const userToUpdate = await this.findOne({ _id: user._id })
    if (!userToUpdate) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND)
    }

    if (input.name) {
      userToUpdate.name = input.name
    }
    if (input.phone) {
      userToUpdate.phone = input.phone
    }

    return await userToUpdate.save()
  }
}
