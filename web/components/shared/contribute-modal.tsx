'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CircleDollarSign,
  Github,
  Heart,
  MessageSquare,
  Star,
  Coins,
  Check,
  Copy,
} from 'lucide-react'
import Link from 'next/link'
import { ExternalLinks } from '@/config/external-links'

// Add constants for localStorage and timing
const STORAGE_KEYS = {
  LAST_SHOWN: 'contribute_modal_last_shown',
  HAS_CONTRIBUTED: 'contribute_modal_has_contributed',
}

const SHOW_INTERVAL = 1 * 24 * 60 * 60 * 1000 // 1 days in milliseconds
const RANDOM_CHANCE = 0.3 // 30% chance to show when eligible

export function ContributeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [cryptoOpen, setCryptoOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState('')

  const cryptoWallets = [
    {
      name: 'Bitcoin (BTC)',
      address: 'bc1qhffsnhp8ynqy6xvh982cu0x5w7vguuum3nqae9',
      network: 'Bitcoin',
    },
    {
      name: 'Ethereum (ETH)',
      address: '0xDB8560a42bdaa42C58462C6b2ee5A7D36F1c1f2a',
      network: 'Ethereum (ERC20)',
    },
    {
      name: 'Tether (USDT)',
      address: '0xDB8560a42bdaa42C58462C6b2ee5A7D36F1c1f2a',
      network: 'Ethereum (ERC20)',
    },
    {
      name: 'Monero (XMR)',
      address:
        '856J5eHJM7bgBhkc51oCuMYUGKvUvF1zwAWrQsqwuH1shG9qnX4YkoZbMmhCPep1JragY2W1hpzAnDda6BXvCgZxUJhUyTg',
      network: 'Monero (XMR)',
    },
  ]

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(''), 3000)
  }

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
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto flex flex-col'>
          <DialogHeader>
            <DialogTitle>Support textbee.dev</DialogTitle>
            <DialogDescription>
              Your contribution helps keep this project alive and growing.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 flex-1'>
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
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setCryptoOpen(true)}
                  >
                    <Coins className='mr-2 h-4 w-4' />
                    Donate Cryptocurrency
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
          </div>

          <DialogFooter className='sticky bottom-0 bg-background pt-4 border-t mt-auto'>
            <Button variant='ghost' onClick={handleContributed} asChild>
              <Link href='#'>I&apos;ve already donated</Link>
            </Button>
            <Button variant='secondary' onClick={() => setIsOpen(false)}>
              Remind me later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cryptoOpen} onOpenChange={setCryptoOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Donate Cryptocurrency</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {cryptoWallets.map((wallet, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-4 rounded-lg bg-gray-100 dark:bg-muted'
              >
                <div>
                  <h4 className='font-semibold'>{wallet.name}</h4>
                  <p className='text-sm text-gray-500'>{wallet.network}</p>
                  <p className='text-xs text-gray-400 mt-1 break-all'>
                    {wallet.address}
                  </p>
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => copyToClipboard(wallet.address)}
                >
                  {copiedAddress === wallet.address ? (
                    <Check className='h-4 w-4' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
