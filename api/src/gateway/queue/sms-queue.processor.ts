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

      // Mark individual SMS records as failed when their FCM push failed
      for (let i = 0; i < response.responses.length; i++) {
        if (!response.responses[i].success) {
          try {
            const smsData = JSON.parse(fcmMessages[i].data.smsData)
            await this.smsModel.findByIdAndUpdate(smsData.smsId, {
              $set: {
                status: 'failed',
                failedAt: new Date(),
                errorCode: 'FCM_DELIVERY_FAILED',
                errorMessage:
                  response.responses[i].error?.message ||
                  'FCM push notification delivery failed',
              },
            })
          } catch (parseError) {
            this.logger.error(
              `Failed to mark SMS as failed for FCM message index ${i}`,
              parseError,
            )
          }
        }
      }

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

      // Mark all individual SMS in this batch of FCM messages as failed
      for (const fcmMessage of fcmMessages) {
        try {
          const smsData = JSON.parse(fcmMessage.data.smsData)
          await this.smsModel.findByIdAndUpdate(smsData.smsId, {
            $set: {
              status: 'failed',
              failedAt: new Date(),
              errorCode: 'FCM_SEND_ERROR',
              errorMessage: error?.message || 'FCM sendEach call failed',
            },
          })
        } catch (parseError) {
          this.logger.error(
            'Failed to mark SMS as failed after FCM error',
            parseError,
          )
        }
      }

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
