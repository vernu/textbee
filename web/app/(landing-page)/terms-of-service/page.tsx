import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Terms of Service | TextBee',
  description: 'Terms of Service for TextBee SMS Gateway Platform',
}

export default function TermsOfServicePage() {
  return (
    <div className='container max-w-7xl py-6 md:px-12'>
      <Card className='border-none shadow-none'>
        <CardContent className='space-y-6'>
          <h1 className='scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl'>
            Terms of Service
          </h1>

          <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
            Effective Date: January 2024
          </h2>

          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            Welcome to TextBee SMS Gateway Platform. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of our services, including our website, mobile applications, APIs, and other software (&ldquo;Services&rdquo;). By accessing or using our Services, you agree to be bound by these Terms.
          </p>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              MIT License
            </h2>
            <p className='leading-7'>
              Copyright (c) 2024 TextBee
            </p>
            <p className='leading-7'>
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files (the &ldquo;Software&rdquo;), to deal
              in the Software without restriction, including without limitation the rights
              to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
              copies of the Software, and to permit persons to whom the Software is
              furnished to do so, subject to the following conditions:
            </p>
            <p className='leading-7'>
              The above copyright notice and this permission notice shall be included in all
              copies or substantial portions of the Software.
            </p>
            <p className='leading-7'>
              THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
              AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
              LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
              OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
              SOFTWARE.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              1. Description of Services
            </h2>
            <p className='leading-7'>
              TextBee provides an SMS gateway platform that allows users to send and receive SMS messages through their Android devices. Our Services include:
            </p>
            <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
              <li>SMS gateway functionality</li>
              <li>API access for integration with other applications</li>
              <li>Web dashboard for managing SMS communications</li>
              <li>Analytics and reporting tools</li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              2. User Responsibilities
            </h2>
            <p className='leading-7'>
              While our software is provided under the MIT license, users are still responsible for:
            </p>
            <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
              <li>Complying with all applicable laws and regulations, including those related to SMS messaging, spam, and data privacy</li>
              <li>Obtaining proper consent from recipients before sending SMS messages</li>
              <li>Not using our Services for any illegal, harmful, or fraudulent activities</li>
              <li>Maintaining the security of their account credentials</li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              3. Privacy
            </h2>
            <p className='leading-7'>
              Our Privacy Policy, available at{' '}
              <a
                href='/privacy-policy'
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                Privacy Policy
              </a>
              , describes how we collect, use, and share your personal information. By using our Services, you consent to our collection and use of your information as described in the Privacy Policy.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              4. Disclaimer of Warranty
            </h2>
            <p className='leading-7'>
              As stated in the MIT license, the software is provided &ldquo;as is&rdquo;, without warranty of any kind. We make no guarantees regarding the reliability, availability, or suitability of our Services for your specific needs.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              5. Changes to Terms
            </h2>
            <p className='leading-7'>
              We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on this page and updating the "Effective Date" at the top of these Terms. Your continued use of our Services after such changes constitutes your acceptance of the new Terms.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              6. Contact Us
            </h2>
            <p className='leading-7'>
              If you have any questions or concerns about these Terms, please contact us at{' '}
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
  )
} 