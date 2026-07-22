import { Skeleton } from '@/components/ui/skeleton'

// Section-level fallback for dashboard routes without a nested loading file
// (home, community). Padding mirrors those pages so nothing shifts when the
// real content lands. Sections with their own layout (messaging, webhooks,
// account) use their nested loading files instead, which keep the tabs
// mounted during tab switches.
export default function Loading() {
  return (
    <div role='status' className='flex-1 space-y-6 p-4 sm:p-6 md:p-8'>
      <span className='sr-only'>Loading</span>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-4 w-72' />
      </div>
      <Skeleton className='h-32 w-full rounded-xl' />
      <Skeleton className='h-32 w-full rounded-xl' />
    </div>
  )
}
