import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Device, DeviceDocument } from '../schemas/device.schema'
import * as firebaseAdmin from 'firebase-admin'
import { Message } from 'firebase-admin/messaging'

@Injectable()
export class HeartbeatCheckTask {
  private readonly logger = new Logger(HeartbeatCheckTask.name)

  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  /**
   * Cron job that runs every 5 minutes to check for devices with stale heartbeats
   * (>30 minutes) and send FCM push notifications to trigger heartbeat requests.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAndTriggerStaleHeartbeats() {
    this.logger.log('Running cron job to check for stale heartbeats')

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    try {
      // Find devices with stale heartbeats
      const devices = await this.deviceModel.find({
        heartbeatEnabled: true,
        enabled: true,
        $or: [
          { lastHeartbeat: null },
          { lastHeartbeat: { $lt: thirtyMinutesAgo } },
        ],
        fcmToken: { $exists: true, $ne: null },
      })

      if (devices.length === 0) {
        this.logger.log('No devices with stale heartbeats found')
        return
      }

      this.logger.log(
        `Found ${devices.length} device(s) with stale heartbeats, sending FCM notifications`,
      )

      // Send FCM messages to trigger heartbeats
      const fcmMessages: Message[] = []
      const deviceIds: string[] = []

      for (const device of devices) {
        if (!device.fcmToken) {
          continue
        }

        const fcmMessage: Message = {
          data: {
            type: 'heartbeat_check',
          },
          token: device.fcmToken,
          android: {
            priority: 'high',
          },
        }

        fcmMessages.push(fcmMessage)
        deviceIds.push(device._id.toString())
      }

      if (fcmMessages.length === 0) {
        this.logger.warn('No valid FCM tokens found for devices with stale heartbeats')
        return
      }

      // Send FCM messages
      const response = await firebaseAdmin.messaging().sendEach(fcmMessages)

      this.logger.log(
        `Sent ${response.successCount} heartbeat check FCM notification(s), ${response.failureCount} failed`,
      )

      // Log failures for debugging
      if (response.failureCount > 0) {
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            this.logger.error(
              `Failed to send heartbeat check to device ${deviceIds[index]}: ${resp.error?.message || 'Unknown error'}`,
            )
          }
        })
      }
    } catch (error) {
      this.logger.error('Error checking and triggering stale heartbeats', error)
    }
  }
}
