import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User, UserDocument } from './schemas/user.schema'
import { Model } from 'mongoose'
import { UpdateOnboardingDTO } from '../auth/auth.dto'
import {
  ONBOARDING_OPTIONAL_STEP_IDS,
  ONBOARDING_STEP_ORDER,
} from './onboarding.constants'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findOne(params) {
    return await this.userModel.findOne(params)
  }

  // Only for flows that verify a password. Never return this to a client.
  async findOneWithPassword(params) {
    return await this.userModel.findOne(params).select('+password')
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

  async updateOnboarding(input: UpdateOnboardingDTO, user: UserDocument) {
    const u = await this.findOne({ _id: user._id })
    if (!u) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND)
    }

    if (!u.onboarding) {
      u.onboarding = {
        currentStepId: 'verify_email',
        skippedStepIds: [],
      }
    }
    if (!u.onboarding.skippedStepIds) {
      u.onboarding.skippedStepIds = []
    }

    if (input.skipStepId) {
      if (
        !ONBOARDING_OPTIONAL_STEP_IDS.includes(
          input.skipStepId as (typeof ONBOARDING_OPTIONAL_STEP_IDS)[number],
        )
      ) {
        throw new HttpException(
          { error: 'Step is not optional' },
          HttpStatus.BAD_REQUEST,
        )
      }
      if (!u.onboarding.skippedStepIds.includes(input.skipStepId)) {
        u.onboarding.skippedStepIds.push(input.skipStepId)
      }
      const idx = ONBOARDING_STEP_ORDER.indexOf(
        input.skipStepId as (typeof ONBOARDING_STEP_ORDER)[number],
      )
      if (idx >= 0 && idx < ONBOARDING_STEP_ORDER.length - 1) {
        u.onboarding.currentStepId = ONBOARDING_STEP_ORDER[idx + 1]
      }
    }

    if (input.currentStepId) {
      u.onboarding.currentStepId = input.currentStepId
    }

    if (input.complete === true && !u.onboarding.completedAt) {
      u.onboarding.completedAt = new Date()
    }

    u.markModified('onboarding')
    return await u.save()
  }

}
