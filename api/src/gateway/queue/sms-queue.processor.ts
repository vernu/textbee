import { Process, Processor } from '@nestjs/bull'
import { InjectModel } from '@nestjs/mongoose'
import { Job } from 'bull'
import { Model } from 'mongoose'
import * as firebaseAdmin from 'firebase-admin'
import { Device } from '../schemas/device.schema'
import { SMS } from '../schemas/sms.schema'
import { SMSBatch } from '../schemas/sms-batch.schema'
import { WebhookService } from 'src/webhook/webhook.service'
import { WebhookEvent } from 'src/webhook/webhook-event.enum'
import { Logger } from '@nestjs/common'

function getFcmErrorCode(error: { code?: string; message?: string } | null): string {
  if (!error?.code) return 'FCM_DELIVERY_FAILED'
  const code = String(error.code).toLowerCase().replace(/^messaging\//, '')
  if (
    code === 'registration-token-not-registered' ||
    code === 'unregistered'
  ) {
    return 'FCM_TOKEN_NOT_REGISTERED'
  }
  if (
    code === 'invalid-registration-token' ||
    code === 'invalid-argument'
  ) {
    return 'FCM_INVALID_REGISTRATION_TOKEN'
  }
  if (code === 'mismatched-credential') {
    return 'FCM_PROJECT_MISMATCH'
  }
  return `FCM_DELIVERY_FAILED_${error.code}`
}

const FCM_ACTIONABLE_MESSAGE =
  'The device token is invalid. Please open the textbee mobile app, click on the update button to resync and try again.'

function getFcmErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  const rawPart = `FCM_DELIVERY_FAILED: ${error?.message || 'FCM delivery failed'}`
  return `${rawPart} — ${FCM_ACTIONABLE_MESSAGE}`
}

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

    const device = await this.deviceModel
      .findById(deviceId)
      .populate('user')
      .exec()
    if (!device?.user) {
      this.logger.warn(
        `Device or user not found for deviceId ${deviceId}, webhooks will be skipped`,
      )
    }

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
            const fcmError = response.responses[i].error
            const updatedSms = await this.smsModel.findByIdAndUpdate(
              smsData.smsId,
              {
                $set: {
                  status: 'failed',
                  failedAt: new Date(),
                  errorCode: getFcmErrorCode(fcmError ?? undefined),
                  errorMessage: getFcmErrorMessage(fcmError ?? undefined),
                },
              },
              { new: true },
            )
            if (device?.user && updatedSms) {
              await this.webhookService
                .deliverNotification({
                  sms: updatedSms,
                  user: device.user as any,
                  event: WebhookEvent.MESSAGE_FAILED,
                })
                .catch((e) =>
                  this.logger.warn(
                    `Webhook delivery failed for SMS ${updatedSms._id}`,
                    e?.message,
                  ),
                )
            }
          } catch (parseError) {
            this.logger.error(
              `Failed to mark SMS as failed for FCM message index ${i}`,
              parseError,
            )
          }
        }
      }

      // Mark individual SMS records as dispatched when FCM push succeeded
      const now = new Date()
      for (let i = 0; i < response.responses.length; i++) {
        if (response.responses[i].success) {
          try {
            const smsData = JSON.parse(fcmMessages[i].data.smsData)
            await this.smsModel.findByIdAndUpdate(smsData.smsId, {
              $set: { status: 'dispatched', dispatchedAt: now },
            })
          } catch (parseError) {
            this.logger.error(
              `Failed to mark SMS as dispatched for FCM message index ${i}`,
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

      const batchStatus =
        smsBatch.failureCount === smsBatch.recipientCount
          ? 'failed'
          : smsBatch.successCount === smsBatch.recipientCount
            ? 'completed'
            : 'partial_success'
      await this.smsBatchModel.findByIdAndUpdate(smsBatchId, {
        $set: { status: batchStatus },
      })

      return response
    } catch (error) {
      this.logger.error(`Failed to process SMS job ${job.id}`, error)

      // Mark all individual SMS in this batch of FCM messages as failed
      for (const fcmMessage of fcmMessages) {
        try {
          const smsData = JSON.parse(fcmMessage.data.smsData)
          const updatedSms = await this.smsModel.findByIdAndUpdate(
            smsData.smsId,
            {
              $set: {
                status: 'failed',
                failedAt: new Date(),
                errorCode:
                  (error as any)?.code != null
                    ? getFcmErrorCode(error as any)
                    : 'FCM_SEND_ERROR',
                errorMessage: getFcmErrorMessage(error as any),
              },
            },
            { new: true },
          )
          if (device?.user && updatedSms) {
            await this.webhookService
              .deliverNotification({
                sms: updatedSms,
                user: device.user as any,
                event: WebhookEvent.MESSAGE_FAILED,
              })
              .catch((e) =>
                this.logger.warn(
                  `Webhook delivery failed for SMS ${updatedSms._id}`,
                  e?.message,
                ),
              )
          }
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
