import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Privacy Policy | TextBee',
  description: 'Privacy Policy for TextBee SMS Gateway Platform',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className='container max-w-7xl py-6 md:px-12'>
        <Card className='border-none shadow-none'>
          <CardContent className='space-y-6'>
            <h1 className='scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl'>
              Privacy Policy
            </h1>

            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              Effective Date: May 2022
            </h2>

            <p className='leading-7 [&:not(:first-child)]:mt-6'>
              Thank you for using our TextBee SMS Gateway Platform
              (&ldquo;Platform&rdquo;). This Privacy Policy is intended to
              inform you about how we collect, use, and disclose information
              when you use our Platform. We are committed to protecting your
              privacy and ensuring the security of your personal information. By
              using our Platform, you consent to the practices described in this
              Privacy Policy.
            </p>

            <div className='space-y-4'>
              <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
                1. Information We Collect
              </h2>
              <h3 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
                1.1 Personal Information:
              </h3>
              <p className='leading-7'>
                We may collect the following types of personal information from
                you when you use our Platform:
              </p>
              <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
                <li>Your name</li>
                <li>
                  Contact information (such as email address and phone number)
                </li>
                <li>
                  Device information (such as device ID, model, and operating
                  system)
                </li>
                <li>SMS content and metadata</li>
              </ul>
            </div>

            {/* ... Continue with other sections ... */}

            <div className='space-y-4'>
              <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
                8. Contact Us
              </h2>
              <p className='leading-7'>
                If you have any questions or concerns about this Privacy Policy
                or our data practices, please contact us at{' '}
                <a
                  href='mailto:contact@textbee.dev'
                  className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
                >
                  contact@textbee.dev
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
