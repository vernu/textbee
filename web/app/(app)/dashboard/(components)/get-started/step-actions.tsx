'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Routes } from '@/config/routes'
import GenerateApiKey from '../generate-api-key'
import PlanPicker from './plan-picker'

type StepActionsProps = {
  stepId: string
  isSaving: boolean
  subLoading: boolean
  onSkipStep: (stepId: string) => void
  onOpenRegisterHelp: () => void
}

// Call-to-action block for the currently active onboarding step.
export default function StepActions({
  stepId,
  isSaving,
  subLoading,
  onSkipStep,
  onOpenRegisterHelp,
}: StepActionsProps) {
  switch (stepId) {
    case 'verify_email':
      return (
        <Button size='sm' asChild>
          <Link href={Routes.verifyEmail}>Verify email</Link>
        </Button>
      )
    case 'download_app':
      return (
        <>
          <Button
            variant='outline'
            size='sm'
            onClick={() => window.open(Routes.downloadAndroidApp, '_blank')}
          >
            <Download className='h-4 w-4' />
            Download APK
          </Button>
          <Button
            variant='link'
            size='sm'
            className='h-auto px-2 text-muted-foreground'
            disabled={isSaving}
            onClick={() => onSkipStep('download_app')}
          >
            Skip →
          </Button>
        </>
      )
    case 'api_key':
      return <GenerateApiKey />
    case 'register_device':
      return (
        <Button variant='outline' size='sm' onClick={onOpenRegisterHelp}>
          How to register
        </Button>
      )
    case 'choose_plan':
      return (
        <PlanPicker
          isLoading={subLoading}
          isSaving={isSaving}
          onSkip={() => onSkipStep('choose_plan')}
        />
      )
    case 'first_message':
      return (
        <Button size='sm' asChild>
          <Link href='/dashboard/messaging'>Go to messaging</Link>
        </Button>
      )
    default:
      return null
  }
}
