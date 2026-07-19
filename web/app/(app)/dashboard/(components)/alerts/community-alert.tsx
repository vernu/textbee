import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ExternalLinks } from '@/config/external-links'
import { Github, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function CommunityAlert() {
  return (
    <Alert>
      <AlertDescription className='flex flex-wrap items-center gap-2 md:gap-4'>
        <span className='flex-1'>
          Join our community and support the development!
        </span>
        <div className='flex flex-wrap gap-1 md:gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={ExternalLinks.github} target='_blank' prefetch={false}>
              <Github className='mr-1 h-4 w-4' />
              GitHub
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href={ExternalLinks.patreon} target='_blank' prefetch={false}>
              <Heart className='mr-1 h-4 w-4' />
              Patreon
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href={ExternalLinks.discord} target='_blank' prefetch={false}>
              <MessageSquare className='mr-1 h-4 w-4' />
              Discord
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
