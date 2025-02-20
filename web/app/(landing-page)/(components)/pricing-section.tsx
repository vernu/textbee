'use client'

import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

const PricingSection = () => {
  return (
    <section
      id='pricing'
      className='py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950'
    >
      <div className='container px-4 mx-auto'>
        <div className='max-w-2xl mx-auto mb-12 text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl'>
            Pricing
          </h2>
          <p className='mt-3 text-base text-gray-600 dark:text-gray-400'>
            Choose the perfect plan for your messaging needs
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Free Plan */}
          <div className='flex flex-col p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow'>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
              Free
            </h3>
            <p className='mt-3 text-sm text-gray-600 dark:text-gray-400'>
              Perfect for getting started
            </p>
            <div className='my-6'>
              <span className='text-3xl font-bold text-gray-900 dark:text-white'>
                $0
              </span>
              <span className='text-gray-600 dark:text-gray-400'>/month</span>
            </div>

            <ul className='mb-6 space-y-3 flex-1'>
              <Feature text='Send and receive SMS Messages' />
              <Feature text='Register 1 active device' />
              <Feature text='Max 50 messages per day' />
              <Feature text='Up to 500 messages per month' />
              <Feature text='Up to 50 recipients in bulk' />
              <Feature text='Webhook notifications' />
              <Feature text='Basic support' />
            </ul>

            <Button asChild className='w-full' variant='outline'>
              <Link href='/dashboard?selectedPlan=free'>Get Started</Link>
            </Button>
          </div>

          {/* Pro Plan */}
          <div className='flex flex-col p-5 bg-slate-800 dark:bg-gray-800/60 text-white rounded-lg border border-gray-800 dark:border-gray-600 shadow-lg scale-105 hover:scale-105 transition-transform'>
            <div className='inline-block px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-semibold mb-3'>
              MOST POPULAR
            </div>
            <h3 className='text-xl font-bold'>Pro</h3>
            <p className='mt-3 text-sm text-gray-300'>
              Ideal for most use-cases
            </p>

            <div className='my-6'>
              <div className='grid grid-cols-2 gap-2'>
                {/* Monthly pricing */}
                <div className='space-y-2'>
                  <div className='flex items-baseline'>
                    <span className='text-xs text-gray-400 uppercase'>
                      Monthly
                    </span>
                  </div>
                  <div>
                    <div className='space-y-1'>
                      <div className='text-lg text-gray-400 line-through'>
                        $9.99
                      </div>
                      <div className='flex items-baseline gap-1'>
                        <span className='text-3xl font-bold'>$6.99</span>
                        <span className='text-gray-300'>/month</span>
                      </div>
                    </div>
                    <span className='mt-1 inline-block bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20'>
                      Save 30%
                    </span>
                  </div>
                </div>

                {/* Yearly pricing */}
                <div className='space-y-2 border-l border-gray-800 pl-2'>
                  <div className='flex items-baseline gap-2'>
                    <span className='text-xs text-gray-400 uppercase'>
                      Yearly
                    </span>
                    <span className='text-xs text-green-400'>
                      (2 months free)
                    </span>
                  </div>
                  <div>
                    <div className='space-y-1'>
                      <div className='text-lg text-gray-400 line-through'>
                        $99
                      </div>
                      <div className='flex items-baseline gap-1'>
                        <span className='text-3xl font-bold'>$69</span>
                        <span className='text-gray-300'>/year</span>
                      </div>
                    </div>
                    <span className='mt-1 inline-block bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20'>
                      Save 42%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <ul className='mb-6 space-y-3 flex-1'>
              <Feature text='Everything in Free' light />
              <Feature text='Register upto 5 active devices' light />
              <Feature
                text='Unlimited daily messages (within monthly quota)'
                light
              />
              <Feature text='Up to 5,000 messages per month' light />
              <Feature text='No bulk SMS recipient limits' light />
              <Feature text='Priority support' light />
            </ul>

            <Button
              asChild
              className='w-full bg-white text-black hover:bg-gray-100'
            >
              <Link href='/checkout/pro'>Upgrade to Pro</Link>
            </Button>
          </div>

          {/* Custom Plan */}
          <div className='flex flex-col p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow'>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
              Custom
            </h3>
            <p className='mt-3 text-sm text-gray-600 dark:text-gray-400'>
              For more specific needs or custom integrations
            </p>
            <div className='my-6'>
              <span className='text-3xl font-bold text-gray-900 dark:text-white'>
                Custom
              </span>
              <span className='text-gray-600 dark:text-gray-400'> pricing</span>
            </div>

            <ul className='mb-6 space-y-3 flex-1'>
              <Feature text='Custom message limits' />
              <Feature text='Custom bulk limits' />
              <Feature text='Custom integrations' />
              <Feature text='SLA agreement' />
              <Feature text='Dedicated support' />
            </ul>

            <Button asChild className='w-full' variant='outline'>
              <Link href='mailto:sales@textbee.dev?subject=Interested%20in%20TextBee%20Custom%20Plan'>
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

const Feature = ({
  text,
  light = false,
}: {
  text: string
  light?: boolean
}) => (
  <li className='flex items-center'>
    <Check
      className={`h-4 w-4 ${
        light ? 'text-green-400' : 'text-green-500 dark:text-green-400'
      } mr-2`}
    />
    <span
      className={`text-sm ${
        light ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      {text}
    </span>
  </li>
)

export default PricingSection
