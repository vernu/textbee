import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/schemas/user.schema'

export type DeviceDocument = Device & Document

@Schema({ timestamps: true })
export class Device {
  _id?: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: User.name })
  user: User | Types.ObjectId

  @Prop({ type: Boolean, default: false })
  enabled: boolean

  @Prop({ type: String })
  fcmToken: string

  @Prop({ type: String })
  brand: string

  @Prop({ type: String })
  manufacturer: string

  @Prop({ type: String })
  model: string

  @Prop({ type: String, required: false })
  name?: string

  @Prop({ type: String })
  serial: string

  @Prop({ type: String })
  buildId: string

  @Prop({ type: String })
  os: string

  @Prop({ type: String })
  osVersion: string

  @Prop({ type: String })
  appVersionName: string

  @Prop({ type: Number })
  appVersionCode: number

  @Prop({ type: Number, default: 0 })
  sentSMSCount: number

  @Prop({ type: Number, default: 0 })
  receivedSMSCount: number

  @Prop({ type: Boolean, default: true })
  heartbeatEnabled: boolean

  @Prop({ type: Number, default: 30 })
  heartbeatIntervalMinutes: number

  @Prop({ type: Boolean, default: false })
  receiveSMSEnabled: boolean

  @Prop({ type: Date })
  lastHeartbeat: Date

  @Prop({
    type: {
      percentage: Number,
      isCharging: Boolean,
      lastUpdated: Date,
    },
  })
  batteryInfo: {
    percentage?: number
    isCharging?: boolean
    lastUpdated?: Date
  }

  @Prop({
    type: {
      networkType: String,
      lastUpdated: Date,
    },
  })
  networkInfo: {
    networkType?: 'wifi' | 'cellular' | 'none'
    lastUpdated?: Date
  }

  @Prop({
    type: {
      versionName: String,
      versionCode: Number,
      lastUpdated: Date,
    },
  })
  appVersionInfo: {
    versionName?: string
    versionCode?: number
    lastUpdated?: Date
  }

  @Prop({
    type: {
      uptimeMillis: Number,
      lastUpdated: Date,
    },
  })
  deviceUptimeInfo: {
    uptimeMillis?: number
    lastUpdated?: Date
  }

  @Prop({
    type: {
      freeBytes: Number,
      totalBytes: Number,
      maxBytes: Number,
      lastUpdated: Date,
    },
  })
  memoryInfo: {
    freeBytes?: number
    totalBytes?: number
    maxBytes?: number
    lastUpdated?: Date
  }

  @Prop({
    type: {
      availableBytes: Number,
      totalBytes: Number,
      lastUpdated: Date,
    },
  })
  storageInfo: {
    availableBytes?: number
    totalBytes?: number
    lastUpdated?: Date
  }

  @Prop({
    type: {
      timezone: String,
      locale: String,
      lastUpdated: Date,
    },
  })
  systemInfo: {
    timezone?: string
    locale?: string
    lastUpdated?: Date
  }

  @Prop({
    type: {
      lastUpdated: Date,
      sims: [
        {
          subscriptionId: Number,
          iccId: String,
          cardId: Number,
          carrierName: String,
          displayName: String,
          simSlotIndex: Number,
          mcc: String,
          mnc: String,
          countryIso: String,
          subscriptionType: String,
        },
      ],
    },
  })
  simInfo: {
    lastUpdated?: Date
    sims?: Array<{
      subscriptionId: number
      iccId?: string
      cardId?: number
      carrierName?: string
      displayName?: string
      simSlotIndex?: number
      mcc?: string
      mnc?: string
      countryIso?: string
      subscriptionType?: string
    }>
  }
}

export const DeviceSchema = SchemaFactory.createForClass(Device)
