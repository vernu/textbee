import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Github, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { ExternalLinks } from '@/config/external-links'

export default function CommunityLinks() {
  return (
    <div className='grid gap-4 md:grid-cols-4'>
      <Card>
        <CardHeader>
          <CardTitle>One-time Donation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Support us with a one-time donation of your desired amount.
          </p>
          <Link href={ExternalLinks.polar} prefetch={false} target='_blank'>
            <Button className='w-full' variant='destructive'>
              <Heart className='mr-2 h-4 w-4' />
              Donate Once
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support on Patreon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Support the development by becoming a patron.
          </p>
          <Link href={ExternalLinks.patreon} prefetch={false} target='_blank'>
            <Button className='w-full' variant='secondary'>
              <Heart className='mr-2 h-4 w-4' />
              Become a Patron
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Check out our source code and contribute to the project.
          </p>
          <Link href={ExternalLinks.github} prefetch={false} target='_blank'>
            <Button className='w-full'>
              <Github className='mr-2 h-4 w-4' />
              View Source
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discord</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Join our community for support and updates.
          </p>
          <Link href={ExternalLinks.discord} prefetch={false} target='_blank'>
            <Button className='w-full' variant='outline'>
              <MessageSquare className='mr-2 h-4 w-4' />
              Join Discord
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
