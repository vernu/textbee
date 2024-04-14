import { ApiProperty } from '@nestjs/swagger'

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
  receivedAt: Date
}
