import { ApiProperty } from '@nestjs/swagger'

export class PlanDTO {
  @ApiProperty({ type: String })
  name: string

  @ApiProperty({ type: Number })
  monthlyPrice: number

  @ApiProperty({ type: Number })
  yearlyPrice?: number

  @ApiProperty({ type: String })
  polarProductId?: string

  @ApiProperty({ type: String })
  polarMonthlyProductId?: string

  @ApiProperty({ type: String })
  polarYearlyProductId?: string

  @ApiProperty({ type: Boolean })
  isActive: boolean
}

export class PlansResponseDTO extends Array<PlanDTO> {}

export class CheckoutInputDTO {
  @ApiProperty({ type: String, required: true })
  planName: string

  @ApiProperty({ type: String })
  discountId?: string

  @ApiProperty({ type: Boolean })
  isYearly?: boolean
}

export class CheckoutResponseDTO {
  @ApiProperty({ type: String })
  redirectUrl: string
}
