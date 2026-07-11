import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { STEPS } from './steps'

export default function GetStartedCardSkeleton() {
  return (
    <Card className='border-l-4 border-l-primary border border-primary/20 bg-linear-to-br from-primary/10 to-background shadow-sm'>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-8 w-8 shrink-0 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-4 w-48' />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='space-y-0'>
          {STEPS.map((step, index) => {
            const isLast = index === STEPS.length - 1
            return (
              <div key={step.id} className='flex gap-3'>
                <div className='flex w-9 shrink-0 flex-col items-center'>
                  <Skeleton className='h-8 w-8 shrink-0 rounded-full' />
                  {!isLast && (
                    <div className='mt-1 min-h-[20px] w-0.5 flex-1 rounded-full bg-border/60' />
                  )}
                </div>
                <div className={cn('min-w-0 flex-1 pb-6', isLast && 'pb-2')}>
                  <Skeleton
                    className={cn(
                      'h-4 max-w-[220px]',
                      index % 2 === 0 ? 'w-[85%]' : 'w-[70%]'
                    )}
                  />
                  <Skeleton className='mt-2 h-3 max-w-md w-full' />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
