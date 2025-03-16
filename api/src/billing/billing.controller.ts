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

  @Get('current-subscription')
  @UseGuards(AuthGuard)
  async getCurrentSubscription(@Request() req: any) {
    return this.billingService.getCurrentSubscription(req.user)
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

    // store the payload in the database
    await this.billingService.storePolarWebhookPayload(payload)

    // Handle Polar.sh webhook events
    switch (payload.type) {
      case 'subscription.created':
      case 'subscription.active':
      case 'subscription.updated':
        console.log('polar webhook event', payload.type)
        console.log(payload)
        await this.billingService.switchPlan({
          userId: payload.data?.metadata?.userId as string,
          // TODO: remove this after more plans are added
          newPlanName: 'pro',
          newPlanPolarProductId: payload.data?.product?.id,
          currentPeriodStart: payload.data?.currentPeriodStart,
          currentPeriodEnd: payload.data?.currentPeriodEnd,
          status: payload.data?.status,
          subscriptionStartDate: payload.data?.createdAt,
          subscriptionEndDate: payload.data?.canceledAt,
          amount: payload.data?.amount,
          currency: payload.data?.currency,
          recurringInterval: payload.data?.recurringInterval,
        })
        break

      // @ts-ignore
      case 'subscription.cancelled':
        console.log('polar subscription.cancelled')
        console.log(payload)
        await this.billingService.switchPlan({
          // @ts-ignore
          userId: payload?.data?.userId,
          newPlanName: 'free',
        })
        break
      default:
        console.log('Unhandled polar event type:', payload.type)
        break
    }
  }
}
