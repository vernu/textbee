import { Button } from '@/components/ui/button'
import { Routes } from '@/config/routes'
import { Smartphone, Code, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className='relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-muted py-16 sm:py-24'>
      <div className='absolute inset-0 bg-[url(/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]'></div>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative'>
        <div className='grid gap-8 lg:grid-cols-2 lg:gap-16'>
          <div className='flex flex-col justify-center space-y-8'>
            <div className='space-y-4'>
              <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                Transform Your Android into a
                <span className='text-blue-500 block'>
                  {' '}
                  Powerful SMS Gateway
                </span>
              </h1>
              <p className='max-w-[600px] text-gray-500 md:text-xl'>
                Unlock the potential of your device with our open-source
                solution. Send SMS effortlessly through your applications.
              </p>
            </div>
            <div className='flex flex-cdol gap-4 flex-row'>
              <Link href={Routes.register} prefetch={false}>
                <Button className='bg-blue-500 hover:bg-blue-600 dark:text-white' size='lg'>
                  Get Started
                </Button>
              </Link>
              <a href='#how-it-works'>
                <Button variant='outline' size='lg'>
                  How It Works
                </Button>
              </a>
            </div>
            <div className='flex items-center space-x-4 text-sm'>
              <div className='flex items-center'>
                <Smartphone className='mr-2 h-4 w-4 text-blue-500' />
                Android Compatible
              </div>
              <div className='flex items-center'>
                <Code className='mr-2 h-4 w-4 text-blue-500' />
                Open Source
              </div>
              <div className='flex items-center'>
                <Zap className='mr-2 h-4 w-4 text-blue-500' />
                Easy Setup
              </div>
            </div>
          </div>
          <div className='relative mx-auto w-full max-w-lg lg:max-w-none'>
            <div className='absolute -top-4 -right-4 h-72 w-72 bg-blue-100 rounded-full blur-3xl'></div>
            <div className='absolute -bottom-4 -left-4 h-72 w-72 bg-blue-100 rounded-full blur-3xl'></div>
            <div className='relative'>
              <Image
                alt='TextBee App'
                className='relative mx-auto w-full max-w-lg rounded-2xl shadow-xl'
                height='600'
                src='/images/smsgatewayandroid.png'
                style={{
                  objectFit: 'contain',
                }}
                width='500'
              />
              <div className='absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-400 to-blue-300 opacity-20'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
