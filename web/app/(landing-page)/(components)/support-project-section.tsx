'use client'

import { toast } from '@/hooks/use-toast'
import { Button } from '../../../components/ui/button'
import { Heart, Coins, Check, Copy, Star, CreditCard } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import Link from 'next/link'
import { ExternalLinks } from '@/config/external-links'
import { CRYPTO_ADDRESSES } from '@/lib/constants'
import Image from 'next/image'
export default function SupportProjectSection() {
  const [cryptoOpen, setCryptoOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState('')

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    toast({
      title: 'Address copied!',
      description: 'The wallet address has been copied to your clipboard.',
    })
    setTimeout(() => setCopiedAddress(''), 3000)
  }

  return (
    <>
      <section className='container mx-auto py-24 px-4 sm:px-6 lg:px-8 max-w-7xl bg-gray-50 dark:bg-muted rounded-2xl my-12'>
        <div className='mx-auto max-w-[58rem] text-center'>
          <h2 className='text-3xl font-bold mb-4'>Support The Project</h2>
          <p className='text-gray-500 mb-8'>
            Maintaining an open-source project requires time and dedication.
            Your contribution will directly support the development, including
            implementation of new features, enhance performance, and ensure the
            highest level of security and reliability.
          </p>
          <div className='flex flex-col sm:flex-row justify-center gap-4 flex-wrap'>
            <Link href={ExternalLinks.patreon} prefetch={false} target='_blank'>
              <Button className='bg-blue-500 hover:bg-blue-600 text-white sm:w-auto w-full'>
                <Heart className='mr-2 h-4 w-4' /> Become a Patron
              </Button>
            </Link>
            <Link href={ExternalLinks.github} prefetch={false} target='_blank'>
              <Button variant='outline' className='sm:w-auto w-full'>
                <Star className='mr-2 h-4 w-4' /> Star on GitHub
              </Button>
            </Link>
            <Link href={ExternalLinks.polar} prefetch={false} target='_blank'>
              <Button variant='outline' className='sm:w-auto w-full'>
                <CreditCard className='mr-2 h-4 w-4' /> One-time Donation
              </Button>
            </Link>
            <Button
              variant='outline'
              onClick={() => setCryptoOpen(true)}
              className='sm:w-auto w-full'
            >
              <Coins className='mr-2 h-4 w-4' /> Donate Crypto
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={cryptoOpen} onOpenChange={setCryptoOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Donate Cryptocurrency</DialogTitle>
          </DialogHeader>
          <div className='grid gap-2 py-2'>
            {CRYPTO_ADDRESSES.map((wallet, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-muted'
              >
                <div className='flex items-center gap-2'>
                  <Image
                    src={wallet.icon}
                    alt={wallet.name}
                    width={24}
                    height={24}
                  />
                  <div>
                    <div className='flex items-center gap-2'>
                      <h4 className='font-medium text-sm'>{wallet.name}</h4>
                      <span className='text-xs text-gray-500'>({wallet.network})</span>
                    </div>
                    <p className='text-xs text-gray-400 break-all'>
                      {wallet.address}
                    </p>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(wallet.address)}
                  className='h-8 w-8'
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
