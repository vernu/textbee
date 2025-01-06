'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CircleDollarSign,
  Github,
  Heart,
  MessageSquare,
  Star,
} from 'lucide-react'
import Link from 'next/link'
import { ExternalLinks } from '@/config/external-links'

// Add constants for localStorage and timing
const STORAGE_KEYS = {
  LAST_SHOWN: 'contribute_modal_last_shown',
  HAS_CONTRIBUTED: 'contribute_modal_has_contributed',
}

const SHOW_INTERVAL = 1 * 24 * 60 * 60 * 1000 // 1 days in milliseconds
const RANDOM_CHANCE = 0.2 // 20% chance to show when eligible

export function ContributeModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkAndShowModal = () => {
      const hasContributed =
        localStorage.getItem(STORAGE_KEYS.HAS_CONTRIBUTED) === 'true'
      if (hasContributed) return

      const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN)
      const now = Date.now()

      if (!lastShown || now - parseInt(lastShown) >= SHOW_INTERVAL) {
        if (Math.random() < RANDOM_CHANCE) {
          setIsOpen(true)
          localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, now.toString())
        }
      }
    }

    checkAndShowModal()

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAndShowModal()
      }
    })
  }, [])

  const handleContributed = () => {
    localStorage.setItem(STORAGE_KEYS.HAS_CONTRIBUTED, 'true')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='max-w-md max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Support textbee.dev</DialogTitle>
          <DialogDescription>
            Your contribution helps keep this project alive and growing.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <CircleDollarSign className='h-5 w-5' />
                Financial Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <Button className='w-full' asChild>
                  <Link href={ExternalLinks.patreon} target='_blank'>
                    <Heart className='mr-2 h-4 w-4' />
                    Monthly Support on Patreon
                  </Link>
                </Button>
                <Button variant='outline' className='w-full' asChild>
                  <Link href={ExternalLinks.polar} target='_blank'>
                    <Star className='mr-2 h-4 w-4' />
                    One-time Donation via Polar.sh
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Github className='h-5 w-5' />
                Code Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-4'>
                <Button asChild>
                  <Link href={ExternalLinks.github} target='_blank'>
                    <Star className='mr-2 h-4 w-4' />
                    Star on GitHub
                  </Link>
                </Button>
                <Button variant='outline' asChild>
                  <Link
                    href={`${ExternalLinks.github}/issues/new`}
                    target='_blank'
                  >
                    <MessageSquare className='mr-2 h-4 w-4' />
                    Report Issue
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className='flex justify-end gap-4 pt-4 border-t'>
            <Button variant='ghost' onClick={handleContributed} asChild>
              <Link href='#'>I&apos;ve already donated</Link>
            </Button>
            <Button variant='secondary' onClick={() => setIsOpen(false)}>
              Remind me later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
