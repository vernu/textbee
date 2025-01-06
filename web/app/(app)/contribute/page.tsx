'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bitcoin,
  CircleDollarSign,
  Copy,
  Github,
  Heart,
  MessageSquare,
  Star,
  Wallet,
  Shield,
  Coins,
} from 'lucide-react'
import Link from 'next/link'
import { ExternalLinks } from '@/config/external-links'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  // {
  //   name: 'Tether (USDT)',
  //   address: 'TD6txzY61D6EgnVfMLPsqKhYfyV5iHrbkw',
  //   network: 'Tron (TRC20)',
  // },
  {
    name: 'Monero (XMR)',
    address:
      '856J5eHJM7bgBhkc51oCuMYUGKvUvF1zwAWrQsqwuH1shG9qnX4YkoZbMmhCPep1JragY2W1hpzAnDda6BXvCgZxUJhUyTg',
    network: 'Monero (XMR)',
  },
]

export default function ContributePage() {
  const { toast } = useToast()

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: `${type} address copied to clipboard`,
    })
  }

  return (
    <div className='min-h-screen p-4 md:p-8 space-y-8'>
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold'>Support TextBee</h1>
        <p className='text-muted-foreground max-w-2xl mx-auto'>
          Your contribution, whether financial or through code, helps keep this
          project alive and growing.
        </p>
      </div>

      <div className='space-y-6 max-w-5xl mx-auto'>
        <Card className='overflow-hidden'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CircleDollarSign className='h-5 w-5' />
              Financial Support
            </CardTitle>
            <CardDescription>
              Help sustain TextBee&apos;s development through financial
              contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-2'>
              <div className='space-y-6'>
                <Card className='overflow-hidden'>
                  <CardHeader>
                    <CardTitle className='text-lg'>Monthly Support</CardTitle>
                    <CardDescription>
                      Become a patron and support us monthly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className='w-full' asChild>
                      <Link href={ExternalLinks.patreon} target='_blank'>
                        <Heart className='mr-2 h-4 w-4' />
                        Support on Patreon
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div className='space-y-6'>
                <Card className='overflow-hidden'>
                  <CardHeader>
                    <CardTitle className='text-lg'>One-time Support</CardTitle>
                    <CardDescription>
                      Make a one-time contribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant='outline' className='w-full' asChild>
                      <Link href={ExternalLinks.polar} target='_blank'>
                        <Heart className='mr-2 h-4 w-4' />
                        Donate on Polar
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className='h-full overflow-hidden'>
                <CardHeader>
                  <CardTitle className='text-lg'>Crypto Donations</CardTitle>
                  <CardDescription>
                    Support us with cryptocurrency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className='w-full' variant='outline'>
                        <Wallet className='mr-2 h-4 w-4' />
                        View Crypto Addresses
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-md'>
                      <DialogHeader>
                        <DialogTitle>
                          Cryptocurrency Donation Addresses
                        </DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        {cryptoWallets.map((wallet, index) => (
                          <div key={index} className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <span className='flex items-center gap-2'>
                                {wallet.name.includes('Bitcoin') ? (
                                  <Bitcoin className='h-4 w-4' />
                                ) : wallet.name.includes('Ethereum') ? (
                                  <Coins className='h-4 w-4' />
                                ) : (
                                  <Wallet className='h-4 w-4' />
                                )}{' '}
                                {wallet.name}
                              </span>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  handleCopy(wallet.address, wallet.name)
                                }
                              >
                                <Copy className='h-4 w-4' />
                              </Button>
                            </div>
                            <code className='text-xs block bg-muted p-2 rounded break-all whitespace-pre-wrap'>
                              {wallet.address}
                            </code>
                            <p className='text-xs text-muted-foreground'>
                              Network: {wallet.network}
                            </p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Github className='h-5 w-5' />
              Code Contributions
            </CardTitle>
            <CardDescription>
              Help improve TextBee by contributing to the codebase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-3'>
              <Card className='overflow-hidden'>
                <CardHeader>
                  <CardTitle className='text-lg'>Star the Project</CardTitle>
                  <CardDescription>
                    Show your support by starring the repository
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className='w-full' asChild>
                    <Link href={ExternalLinks.github} target='_blank'>
                      <Star className='mr-2 h-4 w-4' />
                      Star on GitHub
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className='overflow-hidden'>
                <CardHeader>
                  <CardTitle className='text-lg'>Report Issues</CardTitle>
                  <CardDescription>
                    Help us improve by reporting bugs and suggesting features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className='w-full' variant='outline' asChild>
                    <Link
                      href={`${ExternalLinks.github}/issues/new`}
                      target='_blank'
                    >
                      <MessageSquare className='mr-2 h-4 w-4' />
                      Create Issue
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className='overflow-hidden'>
                <CardHeader>
                  <CardTitle className='text-lg'>Security Reports</CardTitle>
                  <CardDescription>
                    Report security vulnerabilities privately to{' '}
                    <a href='mailto:security@textbee.dev'>
                      security@textbee.dev
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className='w-full' variant='outline' asChild>
                    <Link href='mailto:security@textbee.dev'>
                      <Shield className='mr-2 h-4 w-4' />
                      Report Vulnerability
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className='overflow-hidden'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MessageSquare className='h-5 w-5' />
              Join the Community
            </CardTitle>
            <CardDescription>
              Connect with other contributors and users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className='w-full md:w-auto' variant='outline' asChild>
              <Link href={ExternalLinks.discord} target='_blank'>
                <MessageSquare className='mr-2 h-4 w-4' />
                Join Discord
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
