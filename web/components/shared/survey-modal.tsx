'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'

const STORAGE_KEYS = {
  LAST_SHOWN: 'survey_modal_last_shown',
  HAS_SUBMITTED: 'survey_modal_has_submitted',
}

const SHOW_INTERVAL = 1 * 60 * 60 * 1000 // 1 hour in milliseconds
const RANDOM_CHANCE = 0.5 // 50% chance to show when eligible

export const SurveyModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  const {
    data: currentUser,
    isLoading: isLoadingUser,
    error: currentUserError,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.whoAmI())
        .then((res) => res.data?.data),
  })

  useEffect(() => {
    const checkAndShowModal = () => {
      // Don't show if user data is still loading or there's an error
      if (isLoadingUser || currentUserError) {
        return
      }

      // Don't show if no user data
      if (!currentUser) {
        return
      }

      // Check if user has already submitted
      const hasSubmitted =
        localStorage.getItem(STORAGE_KEYS.HAS_SUBMITTED) === 'true'
      if (hasSubmitted) return

      // Check if user account is less than 3 days old
      if (currentUser?.createdAt) {
        const createdAt = new Date(currentUser.createdAt)
        const now = new Date()
        const daysSinceCreation =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceCreation < 3) {
          return // Don't show modal for new users
        }
      }

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

    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      checkAndShowModal()
    }, 1000)

    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(checkAndShowModal, 500)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentUser, currentUserError, isLoadingUser])

  const handleSubmitted = () => {
    localStorage.setItem(STORAGE_KEYS.HAS_SUBMITTED, 'true')
    setIsOpen(false)
  }

  const handleRemindLater = () => {
    setIsOpen(false)
  }

  // Generate the Google Form URL with prefilled data
  const getFormUrl = () => {
    if (!currentUser) return ''

    const baseUrl =
      'https://docs.google.com/forms/d/e/1FAIpQLSe8Vd6bDvJYxwWFaWHyMYrTrrij0cSquteQiYlvggQLzLJxAw/viewform'
    const nameParam = encodeURIComponent(currentUser.name || '').replace(
      /%20/g,
      '+'
    )
    const emailParam = encodeURIComponent(currentUser.email || '').replace(
      /%20/g,
      '+'
    )

    return `${baseUrl}?usp=pp_url&entry.2069418346=${nameParam}&entry.292129827=${emailParam}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>Help us improve textbee</DialogTitle>
        </DialogHeader>

        <div className='flex-1 min-h-0'>
          <p className='text-muted-foreground mb-4'></p>

          {currentUser && (
            <div className='h-[500px] w-full'>
              <iframe
                src={getFormUrl()}
                width='100%'
                height='100%'
                frameBorder='0'
                marginHeight={0}
                marginWidth={0}
                className='rounded-lg'
                title='textbee.dev feedback survey'
              >
                Loading...
              </iframe>
            </div>
          )}
        </div>

        <DialogFooter className='sticky bottom-0 bg-background pt-4 border-t mt-4 flex justify-between'>
          <div className='flex space-x-2'>
            <Button variant='outline' size='sm' onClick={handleRemindLater}>
              Remind Me Later
            </Button>
            <Button variant='outline' size='sm' onClick={handleSubmitted}>
              Already Submitted
            </Button>
          </div>
          <Button
            size='sm'
            onClick={() => {
              const iframe = document.querySelector(
                'iframe[title="textbee.dev feedback survey"]'
              ) as HTMLIFrameElement
              if (iframe) {
                iframe.focus()
                alert(
                  'Please scroll down in the form and click the Submit button to complete the survey.'
                )
              }
            }}
            className='bg-primary text-primary-foreground hover:bg-primary/90'
          >
            Complete Survey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
