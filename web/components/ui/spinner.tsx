import { cn } from "@/lib/utils"
import { Loader2 } from 'lucide-react'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'muted' | 'white'
}

export function Spinner({ size = 'md', color = 'primary', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn(
        "animate-spin",
        {
          'h-4 w-4': size === 'sm',
          'h-6 w-6': size === 'md',
          'h-8 w-8': size === 'lg',
        },
        {
          'text-primary': color === 'primary',
          'text-secondary-foreground': color === 'secondary',
          'text-muted-foreground': color === 'muted',
          'text-white': color === 'white',
        },
        className
      )}
      {...props}
    >
      <Loader2 className="h-full w-full" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

