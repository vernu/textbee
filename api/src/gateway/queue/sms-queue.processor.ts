import { Process, Processor } from '@nestjs/bull'
import { InjectModel } from '@nestjs/mongoose'
import { Job } from 'bull'
import { Model } from 'mongoose'
import * as firebaseAdmin from 'firebase-admin'
import { Device } from '../schemas/device.schema'
import { SMS } from '../schemas/sms.schema'
import { SMSBatch } from '../schemas/sms-batch.schema'
import { WebhookService } from 'src/webhook/webhook.service'
import { Logger } from '@nestjs/common'

@Processor('sms')
export class SmsQueueProcessor {
  private readonly logger = new Logger(SmsQueueProcessor.name)

  constructor(
    @InjectModel(Device.name) private deviceModel: Model<Device>,
    @InjectModel(SMS.name) private smsModel: Model<SMS>,
    @InjectModel(SMSBatch.name) private smsBatchModel: Model<SMSBatch>,
    private webhookService: WebhookService,
  ) {}

  @Process({
    name: 'send-sms',
    concurrency: 10,
  })
  async handleSendSms(job: Job<any>) {
    this.logger.debug(`Processing send-sms job ${job.id}`)
    const { deviceId, fcmMessages, smsBatchId } = job.data

    try {
      this.smsBatchModel
        .findByIdAndUpdate(smsBatchId, {
          $set: { status: 'processing' },
        })
        .exec()
        .catch((error) => {
          this.logger.error(
            `Failed to update sms batch status to processing ${smsBatchId}`,
            error,
          )
          throw error
        })

      const response = await firebaseAdmin.messaging().sendEach(fcmMessages)

      this.logger.debug(
        `SMS Job ${job.id} completed, success: ${response.successCount}, failures: ${response.failureCount}`,
      )

      // Update device SMS count
      await this.deviceModel
        .findByIdAndUpdate(deviceId, {
          $inc: { sentSMSCount: response.successCount },
        })
        .exec()

      // Update batch status
      const smsBatch = await this.smsBatchModel.findByIdAndUpdate(
        smsBatchId,
        {
          $inc: {
            successCount: response.successCount,
            failureCount: response.failureCount,
          },
        },
        { returnDocument: 'after' },
      )

      if (smsBatch.successCount === smsBatch.recipientCount) {
        await this.smsBatchModel.findByIdAndUpdate(smsBatchId, {
          $set: { status: 'completed' },
        })
      }

      return response
    } catch (error) {
      this.logger.error(`Failed to process SMS job ${job.id}`, error)

      const smsBatch = await this.smsBatchModel.findByIdAndUpdate(
        smsBatchId,
        {
          $inc: {
            failureCount: fcmMessages.length,
          },
        },
        { returnDocument: 'after' },
      )

      const newStatus =
        smsBatch.failureCount === smsBatch.recipientCount
          ? 'failed'
          : 'partial_success'

      await this.smsBatchModel.findByIdAndUpdate(smsBatchId, {
        $set: { status: newStatus },
      })

      throw error
    }
  }
}
