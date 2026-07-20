'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, ExternalLink } from 'lucide-react'
import { Routes } from '@/config/routes'
import { useSubscription } from '@/lib/api'
import {
  PLAN_TIERS,
  formatPlanPrice,
  formatPriceCaption,
  monthlyEquivalent,
  yearlySavingPercent,
  type PlanTier,
} from '@/lib/plans'
import { cn } from '@/lib/utils'

type PlanPickerProps = {
  isLoading: boolean
  isSaving: boolean
  isDone?: boolean
  onSkip: () => void
}

function PlanCard({
  tier,
  isCurrent,
  isSaving,
  onSkip,
}: {
  tier: PlanTier
  isCurrent: boolean
  isSaving: boolean
  onSkip: () => void
}) {
  const free = tier.monthlyPrice <= 0
  const highlight = tier.isPopular && !isCurrent
  const perMonth = monthlyEquivalent(tier)
  const saving = yearlySavingPercent(tier)

  return (
    <Card
      className={cn(
        'flex h-full flex-col',
        // the accent marks one card only, so it still means something
        highlight
          ? 'border-primary shadow-md ring-1 ring-primary'
          : 'border-border shadow-none',
        isCurrent && 'border-primary/40'
      )}
    >
      <CardHeader className='pb-3 pt-5'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='text-base'>{tier.name}</CardTitle>
          {(highlight || isCurrent) && (
            <Badge
              variant={isCurrent ? 'secondary' : 'default'}
              className='text-[10px]'
            >
              {isCurrent ? 'Current' : 'Most popular'}
            </Badge>
          )}
        </div>

        <div className='pt-2'>
          <div className='flex items-baseline gap-1'>
            <span className='text-3xl font-semibold tabular-nums'>
              {formatPlanPrice(perMonth ?? tier.monthlyPrice)}
            </span>
            <span className='text-sm text-muted-foreground'>/month</span>
          </div>
          <CardDescription className='mt-1 tabular-nums'>
            {formatPriceCaption(tier)}
          </CardDescription>
          {saving !== undefined && (
            <Badge variant='secondary' className='mt-2 text-[10px]'>
              Save {saving}% yearly
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='flex-1 pb-4'>
        <ul className='space-y-1.5 text-sm'>
          {tier.features.map((feature) => (
            <li
              key={feature}
              className={cn(
                'flex gap-2',
                free ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              <Check
                className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground'
                aria-hidden
              />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className='mt-auto flex-col items-stretch gap-2 pb-5 pt-0'>
        {isCurrent ? (
          <Button variant='outline' className='w-full' disabled>
            Your current plan
          </Button>
        ) : free ? (
          <Button
            variant='outline'
            className='w-full'
            disabled={isSaving}
            onClick={onSkip}
          >
            Continue with Free
          </Button>
        ) : (
          <>
            {/* above the button so every card's CTA lands on one baseline */}
            <p className='text-center text-xs text-muted-foreground'>
              Cancel anytime, keep access until the end of your billing period.
            </p>
            <Button className='w-full' asChild>
              <Link href={`/checkout/${tier.id}`}>Upgrade to {tier.name}</Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * Plan chooser for the "Choose your plan" onboarding step.
 *
 * Tiers come from lib/plans, which mirrors the marketing pricing page. The
 * previous version hardcoded Free and Pro inline, so Scale never appeared
 * here at all.
 *
 * Custom is intentionally left out: it is a talk-to-us tier with no
 * self-serve checkout, and "Compare all plans" already links to it.
 */
export default function PlanPicker({
  isLoading,
  isSaving,
  isDone = false,
  onSkip,
}: PlanPickerProps) {
  const { data: subscription } = useSubscription()

  // Only the current-plan badge needs the subscription, so this is the one
  // thing worth waiting on.
  if (isLoading) {
    return (
      <div className='grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <Skeleton className='h-64 rounded-lg' />
        <Skeleton className='h-64 rounded-lg' />
        <Skeleton className='h-64 rounded-lg' />
      </div>
    )
  }

  const currentPlan = subscription?.plan?.name?.trim().toLowerCase()

  return (
    <div className='w-full space-y-3'>
      {/* Stacked on a phone, two up on a tablet, all three from lg. */}
      <div className='grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {PLAN_TIERS.map((tier) => (
          <PlanCard
            key={tier.id}
            tier={tier}
            isCurrent={currentPlan === tier.id}
            isSaving={isSaving}
            onSkip={onSkip}
          />
        ))}
      </div>

      <div className='flex flex-wrap items-center gap-4'>
        <Button
          variant='link'
          size='sm'
          className='h-auto px-0 text-xs text-muted-foreground'
          asChild
        >
          <a
            href={`${Routes.landingPage}/pricing`}
            target='_blank'
            rel='noreferrer'
          >
            Compare all plans
            <ExternalLink className='ml-1 h-3 w-3' />
          </a>
        </Button>
        {/* Skipping a step that is already settled would mean nothing. */}
        {!isDone && (
          <Button
            variant='link'
            size='sm'
            className='h-auto px-0 text-muted-foreground'
            disabled={isSaving}
            onClick={onSkip}
          >
            Skip for now →
          </Button>
        )}
      </div>
    </div>
  )
}
