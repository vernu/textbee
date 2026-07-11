'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import GetStartedCardSkeleton from './skeleton'
import RegisterHelpDialog from './register-help-dialog'
import StepActions from './step-actions'
import { useOnboarding } from './use-onboarding'

// Onboarding checklist card shown on the dashboard until setup is complete.
export default function GetStartedCard() {
  const [registerHelpOpen, setRegisterHelpOpen] = useState(false)
  const {
    userData,
    userLoading,
    subLoading,
    stepStates,
    doneCount,
    activeStepId,
    canNavigateToStep,
    selectStep,
    updateOnboarding,
    savingOnboarding,
  } = useOnboarding()

  if (userLoading) {
    return <GetStartedCardSkeleton />
  }

  if (userData?.onboarding?.completedAt) {
    return null
  }

  return (
    <>
      <Card className='border-l-4 border-l-primary border border-primary/20 bg-linear-to-br from-primary/10 to-background shadow-sm animate-fade-in'>
        <CardHeader className='pb-2'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <div className='rounded-full bg-primary/20 p-1.5'>
                <Lightbulb className='h-4 w-4 text-primary' />
              </div>
              <div>
                <CardTitle className='text-lg'>Get Started</CardTitle>
                <CardDescription className='mt-1'>
                  {doneCount} of {stepStates.length} steps complete.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-2'>
          <div className='space-y-0'>
            {stepStates.map((step, index) => {
              const isActive = step.id === activeStepId
              const isLast = index === stepStates.length - 1
              const lineActive =
                step.isDone &&
                (isLast ||
                  stepStates[index + 1].isDone ||
                  stepStates[index + 1]?.id === activeStepId)
              const canClickStep = canNavigateToStep(step.id)

              return (
                <div key={step.id} className='flex gap-3'>
                  <div className='flex w-9 shrink-0 flex-col items-center'>
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        step.isDone &&
                          'bg-primary text-primary-foreground shadow-sm',
                        !step.isDone &&
                          isActive &&
                          'border-2 border-primary bg-background text-primary',
                        !step.isDone &&
                          !isActive &&
                          'bg-muted text-muted-foreground'
                      )}
                    >
                      {step.isDone ? (
                        <Check className='h-4 w-4' strokeWidth={2.5} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          'mt-1 min-h-[20px] w-0.5 flex-1 rounded-full',
                          lineActive ? 'bg-primary/50' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                  <div className={cn('min-w-0 flex-1 pb-6', isLast && 'pb-2')}>
                    <div className='flex flex-wrap items-center gap-2'>
                      {canClickStep ? (
                        <button
                          type='button'
                          className={cn(
                            'text-left text-sm font-medium underline-offset-4 transition-colors hover:text-primary hover:underline',
                            isActive || step.isDone
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                          onClick={() => {
                            selectStep(step.id)
                            updateOnboarding({ currentStepId: step.id })
                          }}
                        >
                          {step.label}
                        </button>
                      ) : (
                        <p
                          className={cn(
                            'text-sm font-medium',
                            step.isDone || isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {step.label}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <>
                        <p className='mt-1 text-sm text-muted-foreground'>
                          {step.description}
                        </p>
                        <div className='mt-3 flex flex-wrap items-center gap-2'>
                          <StepActions
                            stepId={step.id}
                            isSaving={savingOnboarding}
                            subLoading={subLoading}
                            onSkipStep={(id) =>
                              updateOnboarding({ skipStepId: id })
                            }
                            onOpenRegisterHelp={() => setRegisterHelpOpen(true)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
        <CardFooter className='flex justify-end border-t border-border/60 pt-4'>
          <Button
            variant='ghost'
            size='sm'
            disabled={savingOnboarding}
            onClick={() => updateOnboarding({ complete: true })}
          >
            Finish setup
          </Button>
        </CardFooter>
      </Card>

      <RegisterHelpDialog
        open={registerHelpOpen}
        onOpenChange={setRegisterHelpOpen}
      />
    </>
  )
}
