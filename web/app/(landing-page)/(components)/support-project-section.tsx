'use client'

import { toast } from '@/hooks/use-toast'
import { Button } from '../../../components/ui/button'
import { Heart, Coins, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import Link from 'next/link'
import { ExternalLinks } from '@/config/external-links'

export default function SupportProjectSection() {
  const [cryptoOpen, setCryptoOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState('')

  const cryptoWallets = [
    {
      name: 'Bitcoin (BTC)',
      address: '1Ag3nQKGDdmcqSZicRRKnGGKwfgSkhhA5M',
      network: 'Bitcoin',
    },
    {
      name: 'Ethereum (ETH)',
      address: '0x61368be0052ee9245287ee88f7f1fceb5343e207',
      network: 'Ethereum (ERC20)',
    },
    {
      name: 'Tether (USDT)',
      address: '0x61368be0052ee9245287ee88f7f1fceb5343e207',
      network: 'Ethereum (ERC20)',
    },
    {
      name: 'Tether (USDT)',
      address: 'TD6txzY61D6EgnVfMLPsqKhYfyV5iHrbkw',
      network: 'Tron (TRC20)',
    },
  ]

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
            Maintaining an open-source project requires time and dedication. By
            becoming a patron or donating cryptocurrency, your contribution will
            directly support the development, including implementation of new
            features, enhance performance, and ensure the highest level of
            security and reliability.
          </p>
          <div className='flex flex-col sm:flex-row justify-center gap-4'>
            <Link href={ExternalLinks.patreon} prefetch={false} target='_blank'>
              <Button className='bg-blue-500 hover:bg-blue-600 text-white'>
                <Heart className='mr-2 h-4 w-4' /> Become a Patron
              </Button>
            </Link>
            <Button variant='outline' onClick={() => setCryptoOpen(true)}>
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
