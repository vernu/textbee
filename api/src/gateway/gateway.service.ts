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
import { SMSBatch } from './schemas/sms-batch.schema'
import { Message } from 'firebase-admin/lib/messaging/messaging-api'
@Injectable()
export class GatewayService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(SMS.name) private smsModel: Model<SMS>,
    @InjectModel(SMSBatch.name) private smsBatchModel: Model<SMSBatch>,
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

    const message = smsData.message || smsData.smsBody
    const recipients = smsData.recipients || smsData.receivers

    if (!message) {
      throw new HttpException(
        {
          success: false,
          error: 'Message cannot be blank',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new HttpException(
        {
          success: false,
          error: 'Invalid recipients',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    // TODO: Implement a queue to send the SMS if recipients are too many

    let smsBatch: SMSBatch

    try {
      smsBatch = await this.smsBatchModel.create({
        device: device._id,
        message,
        recipientCount: recipients.length,
        recipientPreview: this.getRecipientsPreview(recipients),
      })
    } catch (e) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to create SMS batch',
          additionalInfo: e,
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const fcmMessages: Message[] = []

    for (const recipient of recipients) {
      const sms = await this.smsModel.create({
        device: device._id,
        smsBatch: smsBatch._id,
        message: message,
        type: SMSType.SENT,
        recipient,
        requestedAt: new Date(),
      })
      const updatedSMSData = {
        smsId: sms._id,
        smsBatchId: smsBatch._id,
        message,
        recipients: [recipient],

        // Legacy fields to be removed in the future
        smsBody: message,
        receivers: [recipient],
      }
      const stringifiedSMSData = JSON.stringify(updatedSMSData)

      const fcmMessage: Message = {
        data: {
          smsData: stringifiedSMSData,
        },
        token: device.fcmToken,
        android: {
          priority: 'high',
        },
      }
      fcmMessages.push(fcmMessage)
    }

    try {
      const response = await firebaseAdmin.messaging().sendEach(fcmMessages)

      console.log(response)

      this.deviceModel
        .findByIdAndUpdate(deviceId, {
          $inc: { sentSMSCount: recipients.length },
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
          success: false,
          error: 'Failed to send SMS',
          additionalInfo: e,
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

    if (
      (!dto.receivedAt && !dto.receivedAtInMillis) ||
      !dto.sender ||
      !dto.message
    ) {
      console.log('Invalid received SMS data')
      throw new HttpException(
        {
          success: false,
          error: 'Invalid received SMS data',
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const receivedAt = dto.receivedAtInMillis
      ? new Date(dto.receivedAtInMillis)
      : dto.receivedAt

    const sms = await this.smsModel.create({
      device: device._id,
      message: dto.message,
      type: SMSType.RECEIVED,
      sender: dto.sender,
      receivedAt,
    })

    this.deviceModel
      .findByIdAndUpdate(deviceId, {
        $inc: { receivedSMSCount: 1 },
      })
      .exec()
      .catch((e) => {
        console.log('Failed to update receivedSMSCount')
        console.log(e)
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

    const totalSentSMSCount = devices.reduce((acc, device) => {
      return acc + (device.sentSMSCount || 0)
    }, 0)

    const totalReceivedSMSCount = devices.reduce((acc, device) => {
      return acc + (device.receivedSMSCount || 0)
    }, 0)

    const totalDeviceCount = devices.length
    const totalApiKeyCount = apiKeys.length

    return {
      totalSentSMSCount,
      totalReceivedSMSCount,
      totalDeviceCount,
      totalApiKeyCount,
    }
  }

  private getRecipientsPreview(recipients: string[]): string {
    if (recipients.length === 0) {
      return null
    } else if (recipients.length === 1) {
      return recipients[0]
    } else if (recipients.length === 2) {
      return `${recipients[0]} and ${recipients[1]}`
    } else if (recipients.length === 3) {
      return `${recipients[0]}, ${recipients[1]}, and ${recipients[2]}`
    } else {
      return `${recipients[0]}, ${recipients[1]}, and ${
        recipients.length - 2
      } others`
    }
  }
}
