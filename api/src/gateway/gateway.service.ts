import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Device, DeviceDocument } from './schemas/device.schema'
import { Model } from 'mongoose'
import * as firebaseAdmin from 'firebase-admin'
import {
  ReceivedSMSDTO,
  RegisterDeviceInputDTO,
  RetrieveSMSDTO,
  SendSMSInputDTO,
} from './gateway.dto'
import { User } from '../users/schemas/user.schema'
import { AuthService } from 'src/auth/auth.service'
import { SMS } from './schemas/sms.schema'
import { SMSType } from './sms-type.enum'
@Injectable()
export class GatewayService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(SMS.name) private smsModel: Model<SMS>,
    private authService: AuthService,
  ) {}

  async registerDevice(
    input: RegisterDeviceInputDTO,
    user: User,
  ): Promise<any> {
    const device = await this.deviceModel.findOne({
      user: user._id,
      model: input.model,
      buildId: input.buildId,
    })

    if (device) {
      return await this.updateDevice(device._id, { ...input, enabled: true })
    } else {
      return await this.deviceModel.create({ ...input, user })
    }
  }

  async getDevicesForUser(user: User): Promise<any> {
    return await this.deviceModel.find({ user: user._id })
  }

  async getDeviceById(deviceId: string): Promise<any> {
    return await this.deviceModel.findById(deviceId)
  }

  async updateDevice(
    deviceId: string,
    input: RegisterDeviceInputDTO,
  ): Promise<any> {
    const device = await this.deviceModel.findById(deviceId)

    if (!device) {
      throw new HttpException(
        {
          error: 'Device not found',
        },
        HttpStatus.NOT_FOUND,
      )
    }

    return await this.deviceModel.findByIdAndUpdate(
      deviceId,
      { $set: input },
      { new: true },
    )
  }

  async deleteDevice(deviceId: string): Promise<any> {
    const device = await this.deviceModel.findById(deviceId)

    if (!device) {
      throw new HttpException(
        {
          error: 'Device not found',
        },
        HttpStatus.NOT_FOUND,
      )
    }

    return {}
    // return await this.deviceModel.findByIdAndDelete(deviceId)
  }

  async sendSMS(deviceId: string, smsData: SendSMSInputDTO): Promise<any> {
    const updatedSMSData = {
      message: smsData.message || smsData.smsBody,
      recipients: smsData.recipients || smsData.receivers,

      // Legacy fields to be removed in the future
      smsBody: smsData.message || smsData.smsBody,
      receivers: smsData.recipients || smsData.receivers,
    }
    const device = await this.deviceModel.findById(deviceId)

    if (!device?.enabled) {
      throw new HttpException(
        {
          success: false,
          error: 'Device does not exist or is not enabled',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const stringifiedSMSData = JSON.stringify(updatedSMSData)
    const payload: any = {
      data: {
        smsData: stringifiedSMSData,
      },
    }

    // TODO: Save SMS and Implement a queue to send the SMS if recipients are too many

    try {
      const response = await firebaseAdmin
        .messaging()
        .sendToDevice(device.fcmToken, payload, { priority: 'high' })

      this.deviceModel
        .findByIdAndUpdate(deviceId, {
          $inc: { sentSMSCount: updatedSMSData.recipients.length },
        })
        .exec()
        .catch((e) => {
          console.log('Failed to update sentSMSCount')
          console.log(e)
        })
      return response
    } catch (e) {
      throw new HttpException(
        {
          error: 'Failed to send SMS',
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async receiveSMS(deviceId: string, dto: ReceivedSMSDTO): Promise<any> {
    const device = await this.deviceModel.findById(deviceId)

    if (!device) {
      throw new HttpException(
        {
          success: false,
          error: 'Device does not exist',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    if (!dto.receivedAt || !dto.sender || !dto.message) {
      throw new HttpException(
        {
          success: false,
          error: 'Invalid received SMS data',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const sms = await this.smsModel.create({
      device: device._id,
      message: dto.message,
      type: SMSType.RECEIVED,
      sender: dto.sender,
      receivedAt: dto.receivedAt,
    })

    // TODO: Implement webhook to forward received SMS to user's callback URL

    return sms
  }

  async getReceivedSMS(deviceId: string): Promise<RetrieveSMSDTO[]> {
    const device = await this.deviceModel.findById(deviceId)

    if (!device) {
      throw new HttpException(
        {
          success: false,
          error: 'Device does not exist',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    return await this.smsModel
      .find(
        {
          device: device._id,
          type: SMSType.RECEIVED,
        },
        null,
        { sort: { receivedAt: -1 }, limit: 200 },
      )
      .populate({
        path: 'device',
        select: '_id brand model buildId enabled',
      })
  }

  async getStatsForUser(user: User) {
    const devices = await this.deviceModel.find({ user: user._id })
    const apiKeys = await this.authService.getUserApiKeys(user)

    const totalSMSCount = devices.reduce((acc, device) => {
      return acc + (device.sentSMSCount || 0)
    }, 0)

    const totalDeviceCount = devices.length
    const totalApiKeyCount = apiKeys.length

    return {
      totalSMSCount,
      totalDeviceCount,
      totalApiKeyCount,
    }
  }
}
