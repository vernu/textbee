'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLinks } from '@/config/external-links'

// Constants for localStorage keys and timing
const STORAGE_KEYS = {
  LAST_SHOWN: 'discord_modal_last_shown',
  HAS_JOINED: 'discord_modal_has_joined',
}

const SHOW_INTERVAL = 1 * 24 * 60 * 60 * 1000 // 1 days in milliseconds
const RANDOM_CHANCE = 0.2 // 20% chance to show when eligible

export const JoinCommunityModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkAndShowModal = () => {
      const hasJoined = localStorage.getItem(STORAGE_KEYS.HAS_JOINED) === 'true'
      if (hasJoined) return

      const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN)
      const now = Date.now()
      const lastShownTime = lastShown ? parseInt(lastShown) : 0
      if (!lastShown || now - lastShownTime >= SHOW_INTERVAL) {
        if (Math.random() < RANDOM_CHANCE) {
          setIsOpen(true)
          localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, now.toString())
        }
      }
    }

    // Check when component mounts
    checkAndShowModal()

    // Also check when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAndShowModal()
      }
    })
  }, [])

  const handleJoined = () => {
    localStorage.setItem(STORAGE_KEYS.HAS_JOINED, 'true')
    setIsOpen(false)
  }

  const handleRemindLater = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Join Our Discord Community!</DialogTitle>
        </DialogHeader>

        <div className='py-4'>
          <p className='text-muted-foreground'>
            Join our Discord community to connect with other users, get help,
            and stay updated with the latest announcements!
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
          <Button variant='outline' onClick={handleRemindLater}>
            Remind Me Later
          </Button>
          <Button variant='outline' onClick={handleJoined} className='gap-2'>
            I&apos;ve Already Joined
          </Button>
          <Button
            variant='default'
            onClick={() => {
              window.open(ExternalLinks.discord, '_blank')
              handleJoined()
            }}
            className='gap-2'
          >
            Join Discord
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
