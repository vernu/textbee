import { Skeleton } from '@/components/ui/skeleton'

// Shown in the content slot while a tab's page segment streams in; the
// section header and tabs from the layout stay mounted above it.
export default function Loading() {
  return (
    <div role='status' className='max-w-3xl space-y-4'>
      <span className='sr-only'>Loading</span>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-28 w-full rounded-lg' />
      <Skeleton className='h-28 w-full rounded-lg' />
    </div>
  )
}
