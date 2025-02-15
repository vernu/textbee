import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common'
import { BillingService } from './billing.service'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import {
  CheckoutInputDTO,
  CheckoutResponseDTO,
  PlansResponseDTO,
} from './billing.dto'

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plans')
  async getPlans(): Promise<PlansResponseDTO> {
    return this.billingService.getPlans()
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  async getCheckoutUrl(
    @Body() payload: CheckoutInputDTO,
    @Request() req: any,
  ): Promise<CheckoutResponseDTO> {
    return this.billingService.getCheckoutUrl({
      user: req.user,
      payload,
      req,
    })
  }

  @Post('webhook/polar')
  async handlePolarWebhook(@Body() data: any, @Request() req: any) {
    const payload = await this.billingService.validatePolarWebhookPayload(
      data,
      req.headers,
    )

    // Handle Polar.sh webhook events
    switch (payload.type) {
      case 'subscription.created':
        await this.billingService.switchPlan({
          userId: payload.data.userId,
          newPlanName: payload.data?.product?.name || 'pro',
          newPlanPolarProductId: payload.data?.product?.id,
        })
        break

      // @ts-ignore
      case 'subscription.cancelled':
        await this.billingService.switchPlan({
          // @ts-ignore
          userId: payload?.data?.userId,
          newPlanName: 'free',
        })
        break
      default:
        console.log('Unhandled event type:', payload.type)
        break
    }
  }
}
