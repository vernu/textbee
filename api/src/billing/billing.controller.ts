import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common'
import { BillingService } from './billing.service'
import { AuthGuard } from 'src/auth/guards/auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import {
  CheckoutInputDTO,
  CheckoutResponseDTO,
  PlansResponseDTO,
} from './billing.dto'
import { BillingNotificationsService } from './billing-notifications.service'

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private billingNotifications: BillingNotificationsService,
  ) {}

  @Get('plans')
  async getPlans(): Promise<PlansResponseDTO> {
    return this.billingService.getPlans()
  }

  @Get('current-subscription')
  @UseGuards(AuthGuard)
  async getCurrentSubscription(@Request() req: any) {
    return this.billingService.getCurrentSubscription(req.user)
  }

  @Get('notifications')
  @UseGuards(AuthGuard)
  async listNotifications(@Request() req: any) {
    return this.billingNotifications.listForUser(req.user._id)
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
      // @ts-ignore
      case 'subscription.canceled':
      // case 'subscription.revoked':
        console.log('polar webhook event', payload.type)
        console.log(payload)
        await this.billingService.cancelSubscription({
          userId: payload.data?.metadata?.userId as string,
          polarProductId: payload.data?.product?.id,
        })
        break
      default:
        console.log('Unhandled polar event type:', payload.type)
        break
    }
  }
}
