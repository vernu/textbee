import { ApiProperty } from '@nestjs/swagger'

export class SimInfoDTO {
  @ApiProperty({ type: Number, required: true })
  subscriptionId: number

  @ApiProperty({ type: String, required: false })
  iccId?: string

  @ApiProperty({ type: Number, required: false })
  cardId?: number

  @ApiProperty({ type: String, required: false })
  carrierName?: string

  @ApiProperty({ type: String, required: false })
  displayName?: string

  @ApiProperty({ type: Number, required: false })
  simSlotIndex?: number

  @ApiProperty({ type: String, required: false })
  mcc?: string

  @ApiProperty({ type: String, required: false })
  mnc?: string

  @ApiProperty({ type: String, required: false })
  countryIso?: string

  @ApiProperty({ type: String, required: false, enum: ['PHYSICAL_SIM', 'ESIM'] })
  subscriptionType?: string
}

export class SimInfoCollectionDTO {
  @ApiProperty({ type: Date, required: true })
  lastUpdated: Date

  @ApiProperty({ type: [SimInfoDTO], required: true })
  sims: SimInfoDTO[]
}

export class RegisterDeviceInputDTO {
  @ApiProperty({ type: Boolean })
  enabled?: boolean

  @ApiProperty({ type: String })
  fcmToken?: string

  @ApiProperty({ type: String })
  brand?: string

  @ApiProperty({ type: String })
  manufacturer?: string

  @ApiProperty({ type: String })
  model?: string

  @ApiProperty({ type: String, required: false })
  name?: string

  @ApiProperty({ type: String })
  serial?: string

  @ApiProperty({ type: String })
  buildId?: string

  @ApiProperty({ type: String })
  os?: string

  @ApiProperty({ type: String })
  osVersion?: string

  @ApiProperty({ type: String })
  appVersionName?: string

  @ApiProperty({ type: String })
  appVersionCode?: number

  @ApiProperty({ type: SimInfoCollectionDTO, required: false })
  simInfo?: SimInfoCollectionDTO
}

export class SMSData {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The message to send',
  })
  message: string

  @ApiProperty({
    type: Array,
    required: true,
    description: 'List of phone numbers to send the SMS to',
    example: ['+2519xxxxxxxx', '+2517xxxxxxxx'],
  })
  recipients: string[]

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Optional SIM subscription ID to use for sending SMS',
  })
  simSubscriptionId?: number

  @ApiProperty({
    type: String,
    required: false,
    description: 'Optional ISO 8601 date string to schedule SMS for future delivery (e.g., "2024-01-15T10:30:00Z"). Must be a future date.',
    example: '2024-01-15T10:30:00Z',
  })
  scheduledAt?: string

  // TODO: restructure the Payload such that it contains bactchId, smsId, recipients and message in an optimized way
  // message: string
  // bactchId: string
  // list: {
  //   smsId: string
  //   recipient: string
  // }

  // Legacy fields to be removed in the future
  // @ApiProperty({
  //   type: String,
  //   required: true,
  //   description: '(Legacy) Will be Replace with `message` field in the future',
  // })
  smsBody: string

  // @ApiProperty({
  //   type: Array,
  //   required: false,
  //   description:
  //     '(Legacy) Will be Replace with `recipients` field in the future',
  //   example: ['+2519xxxxxxxx', '+2517xxxxxxxx'],
  // })
  receivers: string[]
}
export class SendSMSInputDTO extends SMSData {}

export class SendBulkSMSInputDTO {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The template to send the SMS with',
  })
  messageTemplate: string

  @ApiProperty({
    type: [SMSData],
    required: true,
    description: 'The messages to send',
  })
  messages: SMSData[]
}

export class ReceivedSMSDTO {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The message received',
  })
  message: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The phone number of the sender',
  })
  sender: string

  @ApiProperty({
    type: Date,
    required: true,
    description: 'The time the message was received',
  })
  receivedAt?: Date

  @ApiProperty({
    type: Number,
    required: true,
    description: 'The time the message was created',
  })
  receivedAtInMillis?: number
}

export class DeviceDTO {
  @ApiProperty({ type: String })
  _id: string

  @ApiProperty({ type: Boolean })
  enabled: boolean

  @ApiProperty({ type: String })
  brand: string

  @ApiProperty({ type: String })
  manufacturer: string

  @ApiProperty({ type: String })
  model: string

  @ApiProperty({ type: String })
  buildId: string
}

export class RetrieveSMSDTO {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The id of the received SMS',
  })
  _id: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The message received',
  })
  message: string

  @ApiProperty({
    type: DeviceDTO,
    required: true,
    description: 'The device that received the message',
  })
  device: DeviceDTO

  @ApiProperty({
    type: String,
    required: true,
    description: 'The phone number of the sender',
  })
  sender: string

  @ApiProperty({
    type: Date,
    required: true,
    description: 'The time the message was received',
  })
  receivedAt: Date

  @ApiProperty({
    type: Date,
    required: true,
    description: 'The time the message was created',
  })
  createdAt: Date

  @ApiProperty({
    type: Date,
    required: true,
    description: 'The time the message was last updated',
  })
  updatedAt: Date
}

export class PaginationMetaDTO {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Number of items per page',
  })
  limit: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Total number of items',
  })
  total: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Total number of pages',
  })
  totalPages: number;
}

export class RetrieveSMSResponseDTO {
  @ApiProperty({
    type: [RetrieveSMSDTO],
    required: true,
    description: 'The received SMS data',
  })
  data: RetrieveSMSDTO[]

  @ApiProperty({
    type: PaginationMetaDTO,
    required: true,
    description: 'Pagination metadata',
  })
  meta?: PaginationMetaDTO
}

export class UpdateSMSStatusDTO {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The ID of the SMS',
  })
  smsId: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The ID of the SMS batch',
  })
  smsBatchId: string

  @ApiProperty({
    type: String,
    required: true,
    description: 'The status of the SMS (sent, delivered, failed)',
    enum: ['sent', 'delivered', 'failed'],
  })
  status: string

  @ApiProperty({
    type: Number,
    required: false,
    description: 'The time the message was sent (in milliseconds)',
  })
  sentAtInMillis?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'The time the message was delivered (in milliseconds)',
  })
  deliveredAtInMillis?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'The time the message failed (in milliseconds)',
  })
  failedAtInMillis?: number

  @ApiProperty({
    type: String,
    required: false,
    description: 'Error code if the message failed',
  })
  errorCode?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Error message if the message failed',
  })
  errorMessage?: string
}

export class HeartbeatInputDTO {
  @ApiProperty({
    type: String,
    required: false,
    description: 'FCM token for push notifications',
  })
  fcmToken?: string

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Battery percentage (0-100)',
  })
  batteryPercentage?: number

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Whether device is currently charging',
  })
  isCharging?: boolean

  @ApiProperty({
    type: String,
    required: false,
    description: 'Network type',
    enum: ['wifi', 'cellular', 'none'],
  })
  networkType?: 'wifi' | 'cellular' | 'none'

  @ApiProperty({
    type: String,
    required: false,
    description: 'App version name',
  })
  appVersionName?: string

  @ApiProperty({
    type: Number,
    required: false,
    description: 'App version code',
  })
  appVersionCode?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Device uptime in milliseconds since boot',
  })
  deviceUptimeMillis?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Free memory in bytes',
  })
  memoryFreeBytes?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Total memory in bytes',
  })
  memoryTotalBytes?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Max memory in bytes',
  })
  memoryMaxBytes?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Available storage in bytes',
  })
  storageAvailableBytes?: number

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Total storage in bytes',
  })
  storageTotalBytes?: number

  @ApiProperty({
    type: String,
    required: false,
    description: 'Device timezone (e.g., "America/New_York")',
  })
  timezone?: string

  @ApiProperty({
    type: String,
    required: false,
    description: 'Device locale (e.g., "en_US")',
  })
  locale?: string

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Whether receive SMS feature is enabled',
  })
  receiveSMSEnabled?: boolean

  @ApiProperty({ type: SimInfoCollectionDTO, required: false })
  simInfo?: SimInfoCollectionDTO
}

export class HeartbeatResponseDTO {
  @ApiProperty({
    type: Boolean,
    required: true,
    description: 'Whether the heartbeat was successful',
  })
  success: boolean

  @ApiProperty({
    type: Boolean,
    required: true,
    description: 'Whether the FCM token was updated',
  })
  fcmTokenUpdated: boolean

  @ApiProperty({
    type: Date,
    required: true,
    description: 'Server timestamp of the heartbeat',
  })
  lastHeartbeat: Date

  @ApiProperty({
    type: String,
    required: false,
    description: 'Device name (if updated)',
  })
  name?: string
}
