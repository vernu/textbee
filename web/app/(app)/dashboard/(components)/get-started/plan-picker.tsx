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

type PlanPickerProps = {
  isLoading: boolean
  isSaving: boolean
  onSkip: () => void
}

// Free-vs-Pro chooser shown inside the "Choose your plan" onboarding step.
export default function PlanPicker({ isLoading, isSaving, onSkip }: PlanPickerProps) {
  if (isLoading) {
    return (
      <div className='grid w-full gap-3 md:grid-cols-2'>
        <Skeleton className='h-40 rounded-lg' />
        <Skeleton className='h-40 rounded-lg' />
      </div>
    )
  }

  return (
    <>
      <div className='grid w-full gap-3 md:grid-cols-2'>
        <Card className='border-border shadow-none'>
          <CardHeader className='pb-2 pt-4'>
            <CardTitle className='text-base'>Free</CardTitle>
            <CardDescription>$0/month</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2 pb-4 text-sm text-muted-foreground'>
            <p className='flex gap-2'>
              <Check className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
              1 device
            </p>
            <p className='flex gap-2'>
              <Check className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
              50 SMS / day, 300 / month
            </p>
          </CardContent>
          <CardFooter className='flex-col gap-2 pb-4 pt-0'>
            <Button
              variant='outline'
              className='w-full'
              disabled={isSaving}
              onClick={onSkip}
            >
              Continue with Free
            </Button>
          </CardFooter>
        </Card>
        <Card className='relative border-2 border-primary shadow-md'>
          <Badge className='absolute right-3 top-3 text-[10px]'>Recommended</Badge>
          <CardHeader className='pb-2 pt-4 pr-14'>
            <CardTitle className='text-base'>Pro</CardTitle>
            <CardDescription>$10/month</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2 pb-4 text-sm'>
            <p className='flex gap-2 text-foreground'>
              <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
              Up to 5 devices
            </p>
            <p className='flex gap-2 text-foreground'>
              <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
              No daily limit
            </p>
            <p className='flex gap-2 text-foreground'>
              <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
              5,000 SMS / month
            </p>
            <p className='flex gap-2 text-foreground'>
              <Check className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
              Priority support
            </p>
          </CardContent>
          <CardFooter className='flex-col gap-2 pb-4 pt-0'>
            <Button className='w-full' size='sm' asChild>
              <Link href='/checkout/pro'>Upgrade to Pro</Link>
            </Button>
            <Button
              variant='link'
              size='sm'
              className='h-auto text-xs text-muted-foreground'
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
          </CardFooter>
        </Card>
      </div>
      <Button
        variant='link'
        size='sm'
        className='h-auto px-0 text-muted-foreground'
        disabled={isSaving}
        onClick={onSkip}
      >
        Skip for now →
      </Button>
    </>
  )
}
