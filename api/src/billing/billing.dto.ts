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

  @ApiProperty({ enum: ['monthly', 'yearly'], required: false })
  billingInterval?: 'monthly' | 'yearly'
}

export class PlanChangePreviewDTO {
  @ApiProperty({ type: String })
  currentPlan: string

  @ApiProperty({ enum: ['monthly', 'yearly'] })
  currentInterval: string

  @ApiProperty({ type: String })
  newPlan: string

  @ApiProperty({ enum: ['monthly', 'yearly'] })
  newInterval: string

  @ApiProperty({ type: Boolean })
  isUpgrade: boolean

  @ApiProperty({ type: Boolean })
  cancelAtPeriodEnd: boolean
}

export class CheckoutResponseDTO {
  @ApiProperty({ type: String, required: false })
  redirectUrl?: string

  // returned instead of redirectUrl when the user already has an active paid
  // Polar subscription, so the frontend shows a confirmation screen
  @ApiProperty({ type: PlanChangePreviewDTO, required: false })
  planChange?: PlanChangePreviewDTO
}

export class ChangePlanInputDTO {
  @ApiProperty({ type: String, required: true })
  planName: string

  @ApiProperty({ enum: ['monthly', 'yearly'], required: false })
  billingInterval?: 'monthly' | 'yearly'
}

export class ChangePlanResponseDTO {
  @ApiProperty({ type: Boolean })
  success: boolean

  @ApiProperty({ type: String })
  plan: string
}
