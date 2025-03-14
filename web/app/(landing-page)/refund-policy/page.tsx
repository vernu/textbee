import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Refund Policy | TextBee',
  description: 'Refund Policy for TextBee SMS Gateway Platform',
}

export default function RefundPolicyPage() {
  return (
    <div className='container max-w-7xl py-6 md:px-12'>
      <Card className='border-none shadow-none'>
        <CardContent className='space-y-6'>
          <h1 className='scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl'>
            Refund Policy
          </h1>

          <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
            Effective Date: February 15, 2025
          </h2>

          <p className='leading-7 [&:not(:first-child)]:mt-6'>
            Thank you for choosing TextBee SMS Gateway Platform. This Refund Policy outlines our procedures and guidelines regarding refunds for our services. By using our Platform, you agree to the terms of this Refund Policy.
          </p>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              1. Subscription Services
            </h2>
            <p className='leading-7'>
              TextBee offers both free and paid subscription plans for our SMS Gateway services. Our refund policy for paid subscription services is as follows:
            </p>
            <h3 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
              1.1 Free Tier:
            </h3>
            <p className='leading-7'>
              Our free tier is available at no cost and therefore does not qualify for refunds. Users can downgrade to the free tier at any time.
            </p>
            <h3 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
              1.2 Monthly Subscriptions:
            </h3>
            <p className='leading-7'>
              For monthly subscription plans, we offer a 7-day money-back guarantee from the date of purchase. If you are not satisfied with our services, you may request a full refund within this period. After the 7-day period, no refunds will be provided for the current billing cycle.
            </p>
            <h3 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
              1.3 Annual Subscriptions:
            </h3>
            <p className='leading-7'>
              For annual subscription plans, we offer a 14-day money-back guarantee from the date of purchase. If you are not satisfied with our services, you may request a full refund within this period. After the 14-day period, we may provide a prorated refund for the unused portion of your subscription at our discretion.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              2. Future Usage-Based Billing
            </h2>
            <p className='leading-7'>
              For our planned usage-based billing options:
            </p>
            <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
              <li>Unused credits may be eligible for a refund within 30 days of purchase.</li>
              <li>Once credits have been used, they are not eligible for a refund.</li>
              <li>Custom implementation services or integration assistance fees are non-refundable once the work has commenced.</li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              3. How to Request a Refund
            </h2>
            <p className='leading-7'>
              To request a refund, please contact our customer support team at{' '}
              <a
                href='mailto:support@textbee.dev'
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                support@textbee.dev
              </a>{' '}
              with the following information:
            </p>
            <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
              <li>Your account email address</li>
              <li>Date of purchase</li>
              <li>Reason for requesting a refund</li>
              <li>Order or transaction ID (if available)</li>
            </ul>
            <p className='leading-7'>
              We will process your refund request within 5-7 business days and notify you of the outcome.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              4. Exceptions
            </h2>
            <p className='leading-7'>
              We reserve the right to deny refund requests in the following cases:
            </p>
            <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
              <li>Violation of our Terms of Service</li>
              <li>Fraudulent or abusive use of our services</li>
              <li>Requests made after the eligible refund period</li>
              <li>Services that have been fully delivered or consumed</li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              5. Service Interruption or Failure
            </h2>
            <p className='leading-7'>
              In the event of significant service interruption or failure to provide the services you have paid for, you may be eligible for a refund regardless of the standard refund periods outlined above. Such cases include:
            </p>
            <ul className='my-6 ml-6 list-disc [&>li]:mt-2'>
              <li>Extended platform outages (exceeding 24 hours)</li>
              <li>Failure to deliver core SMS gateway functionality</li>
              <li>Significant degradation of service that prevents normal business operations</li>
            </ul>
            <p className='leading-7'>
              Please contact our support team with details of the service interruption or failure, and we will assess your refund eligibility on a case-by-case basis. In some instances, we may offer service credits or partial refunds proportional to the duration and severity of the service issue.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              6. Refund Methods
            </h2>
            <p className='leading-7'>
              Refunds will be issued using the same payment method used for the original purchase. Processing times may vary depending on your payment provider.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              7. Changes to This Policy
            </h2>
            <p className='leading-7'>
              We may update this Refund Policy from time to time. We will notify you of any changes by posting the new Refund Policy on this page and updating the "Effective Date" at the top of this policy.
            </p>
          </div>

          <div className='space-y-4'>
            <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight'>
              8. Contact Us
            </h2>
            <p className='leading-7'>
              If you have any questions or concerns about this Refund Policy, please contact us at{' '}
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