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

export class ISMSData {
  @ApiProperty({
    type: String,
    required: true,
    description: 'SMS text',
  })
  smsBody: string

  @ApiProperty({
    type: Array,
    required: true,
    description: 'Array of phone numbers',
    example: ['+2519xxxxxxxx', '+2517xxxxxxxx'],
  })
  receivers: string[]
}
export class SendSMSInputDTO extends ISMSData {}
