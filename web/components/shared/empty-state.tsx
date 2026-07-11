import type { ComponentType } from 'react'

type EmptyStateProps = {
  icon: ComponentType<{ className?: string }>
  title: string
  hint?: string
}

// Shared empty-state placeholder: icon in a muted circle, title, optional hint.
export default function EmptyState({ icon: Icon, title, hint }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 py-12 text-center animate-fade-in'>
      <div className='rounded-full bg-muted p-3'>
        <Icon className='h-6 w-6 text-muted-foreground' />
      </div>
      <p className='text-sm font-medium text-foreground'>{title}</p>
      {hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
    </div>
  )
}
