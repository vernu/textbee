import { Injectable, Logger } from '@nestjs/common'
import { MetaCapiService, MetaUserContext } from './meta-capi.service'

// Facade over every outbound analytics destination. Two rules hold for all of
// them: nothing is sent unless ANALYTICS_PROVIDERS names the destination, and
// nothing here can fail a request, because a signup must not break when an ad
// platform is down.

export type AnalyticsUser = {
  _id?: any
  email?: string
  attribution?: {
    first?: { fbclid?: string; at?: Date }
    last?: { fbclid?: string; at?: Date }
    fbp?: string
  }
}

export type RequestContext = {
  ip?: string
  userAgent?: string
  country?: string
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)

  constructor(private readonly metaCapi: MetaCapiService) {}

  private providers(): string[] {
    return (process.env.ANALYTICS_PROVIDERS ?? '')
      .split(',')
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean)
  }

  private isEnabled(provider: string): boolean {
    return this.providers().includes(provider)
  }

  private metaUser(
    user: AnalyticsUser,
    context?: RequestContext,
  ): MetaUserContext {
    // Last touch wins for the click id: it is the ad click closest to the
    // conversion, which is the one Meta is trying to price.
    const touch = user.attribution?.last?.fbclid
      ? user.attribution.last
      : user.attribution?.first

    return {
      userId: String(user._id ?? ''),
      email: user.email,
      ip: context?.ip,
      userAgent: context?.userAgent,
      country: context?.country,
      fbclid: touch?.fbclid,
      fbclidAt: touch?.at,
      fbp: user.attribution?.fbp,
    }
  }

  private dispatch(name: string, send: () => Promise<void>) {
    send().catch((error) => {
      this.logger.warn(`Failed to send ${name}: ${error?.message ?? error}`)
    })
  }

  userRegistered(user: AnalyticsUser, context?: RequestContext) {
    if (!this.isEnabled('meta')) return
    this.dispatch('CompleteRegistration', () =>
      this.metaCapi.send({
        name: 'CompleteRegistration',
        user: this.metaUser(user, context),
        sourcePath: '/register',
      }),
    )
  }

  checkoutStarted(
    user: AnalyticsUser,
    plan: string,
    context?: RequestContext,
  ) {
    if (!this.isEnabled('meta')) return
    this.dispatch('InitiateCheckout', () =>
      this.metaCapi.send({
        name: 'InitiateCheckout',
        user: this.metaUser(user, context),
        sourcePath: `/checkout/${plan}`,
        customData: { content_name: plan },
      }),
    )
  }

  /**
   * Only for the first time an account starts paying. Callers gate this on
   * markMilestone('firstPaidAt') so renewals, upgrades and re-subscribes never
   * report a second sale.
   */
  purchase(
    user: AnalyticsUser,
    {
      amount,
      currency,
      plan,
      subscriptionId,
    }: {
      amount?: number
      currency?: string
      plan?: string
      subscriptionId?: string
    },
  ) {
    if (!this.isEnabled('meta')) return
    this.dispatch('Purchase', () =>
      this.metaCapi.send({
        name: 'Purchase',
        // No ip or user agent: this originates from a billing webhook, so the
        // only honest browser context is none.
        user: this.metaUser(user),
        sourcePath: '/dashboard/account',
        idSuffix: subscriptionId,
        customData: {
          // Polar reports money in cents.
          value: typeof amount === 'number' ? amount / 100 : undefined,
          currency: (currency ?? 'usd').toUpperCase(),
          ...(plan && { content_name: plan }),
        },
      }),
    )
  }
}
