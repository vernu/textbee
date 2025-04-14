import { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle2,
  Smartphone,
  MessageSquare,
  Settings,
  ArrowRightCircle,
  Zap,
  ExternalLink,
  BookOpen,
  Star,
  SparkleIcon,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'TextBee Quickstart - Send SMS from Your Android Phone | SMS Gateway',
  description:
    'Get started with TextBee SMS Gateway in minutes. Learn how to send and receive SMS messages using your Android phone as an SMS gateway for your applications.',
  keywords:
    'SMS gateway, Android SMS, API SMS, TextBee quickstart, SMS integration, two-way SMS',
}

export default function QuickstartPage() {
  return (
    <div className='container max-w-5xl mx-auto py-12 px-4 md:px-8'>
      <div className='mb-12 bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-6 md:p-8 border border-primary/20 text-center mx-auto'>
        <div className='inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4'>
          <Zap className='h-3.5 w-3.5' />
          <span>5-minute setup</span>
        </div>

        <h1 className='text-3xl md:text-4xl font-bold mb-4 tracking-tight text-center'>
          TextBee SMS Gateway Quickstart
        </h1>

        <p className='text-lg text-muted-foreground mb-4 mx-auto max-w-2xl text-center'>
          Transform your Android phone into a powerful SMS gateway in just 5
          minutes. Send and receive text messages programmatically through your
          applications with TextBee.
        </p>

        <p className='text-sm text-muted-foreground mb-6 mx-auto max-w-2xl text-center'>
          Our platform enables businesses and developers to implement SMS
          functionality without expensive telecom infrastructure. Perfect for
          notifications, authentication, alerts, and customer engagement.
        </p>

        <div className='flex flex-wrap gap-4 justify-center'>
          <a
            href='https://dl.textbee.dev'
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
          >
            <Smartphone className='h-4 w-4' />
            <span>Download App</span>
          </a>
          <a
            href='#pro-plan'
            className='inline-flex items-center gap-2 px-5 py-2.5 border border-primary/30 text-primary rounded-md hover:bg-primary/10 transition-colors'
          >
            <Star className='h-4 w-4' />
            <span>View Pro Plan</span>
          </a>
        </div>
      </div>

      <div className='hidden md:block relative z-0 mb-12 mx-auto'>
        <div className='absolute top-4 left-4 right-4 h-0.5 bg-muted'></div>

        <div className='flex justify-between items-start px-4 relative z-10'>
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className='flex flex-col items-center'>
              <a
                href={`#step-${step}`}
                className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium hover:bg-primary/20 transition-colors mb-2'
              >
                {step}
              </a>
              <span className='text-xs text-muted-foreground hidden sm:block'>
                Step {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className='mb-10 text-center mx-auto'>
        <h2 className='text-2xl font-semibold mb-3 text-center'>
          The Simplest Way to Add SMS to Your Applications
        </h2>
        <p className='text-muted-foreground mb-4 mx-auto max-w-3xl text-center'>
          TextBee turns any Android phone into a reliable SMS gateway, allowing
          you to send and receive text messages programmatically. Whether you're
          building a notification system, implementing two-factor
          authentication, or creating marketing campaigns, TextBee provides a
          cost-effective solution without the need for complex telecom
          integrations.
        </p>
        <p className='text-muted-foreground mx-auto max-w-3xl text-center'>
          Follow this step-by-step guide to set up TextBee and start sending
          your first SMS messages in minutes. Our straightforward process
          requires minimal technical knowledge and works with any application or
          service that can make HTTP requests.
        </p>
      </div>

      <div className='space-y-12 mx-auto'>
        <div id='step-1' className='pb-8 group'>
          <div className='flex items-center gap-3 mb-6 justify-center'>
            <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shadow-sm'>
              1
            </div>
            <h2 className='text-2xl font-semibold'>Account Setup</h2>
          </div>

          <div className='space-y-4'>
            <p className='text-muted-foreground mb-4 text-center mx-auto max-w-3xl'>
              Begin by creating your TextBee account and installing the Android
              app. This setup process takes less than 2 minutes and only
              requires basic permissions to send and receive SMS messages.
            </p>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto'>
              <div className='bg-card p-4 rounded-lg border hover:shadow-sm transition-shadow'>
                <div className='flex justify-between mb-3'>
                  <span className='text-xl font-bold text-primary/80'>1</span>
                  <CheckCircle2 className='h-5 w-5 text-muted-foreground/50' />
                </div>
                <h3 className='font-medium mb-2'>Create account</h3>
                <p className='text-sm text-muted-foreground'>
                  Register at{' '}
                  <a
                    href='https://textbee.dev'
                    className='text-primary hover:underline'
                  >
                    textbee.dev
                  </a>{' '}
                  with your email and password
                </p>
              </div>

              <div className='bg-card p-4 rounded-lg border hover:shadow-sm transition-shadow'>
                <div className='flex justify-between mb-3'>
                  <span className='text-xl font-bold text-primary/80'>2</span>
                  <Smartphone className='h-5 w-5 text-muted-foreground/50' />
                </div>
                <h3 className='font-medium mb-2'>Install app</h3>
                <p className='text-sm text-muted-foreground'>
                  Download from{' '}
                  <a
                    href='https://dl.textbee.dev'
                    className='text-primary hover:underline'
                  >
                    dl.textbee.dev
                  </a>{' '}
                  or Google Play Store
                </p>
              </div>

              <div className='bg-card p-4 rounded-lg border hover:shadow-sm transition-shadow'>
                <div className='flex justify-between mb-3'>
                  <span className='text-xl font-bold text-primary/80'>3</span>
                  <Settings className='h-5 w-5 text-muted-foreground/50' />
                </div>
                <h3 className='font-medium mb-2'>Grant permissions</h3>
                <p className='text-sm text-muted-foreground'>
                  Allow SMS access in the app to enable message sending and
                  receiving
                </p>
              </div>
            </div>
          </div>
        </div>

        <div id='step-2' className='pb-8 border-t pt-4 group'>
          <div className='flex items-center gap-3 mb-6 justify-center'>
            <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shadow-sm'>
              2
            </div>
            <h2 className='text-2xl font-semibold'>Connect Your Device</h2>
          </div>

          <div className='space-y-4'>
            <p className='text-muted-foreground mb-4 text-center mx-auto max-w-3xl'>
              Link your Android phone to your TextBee account to establish the
              SMS gateway connection. This secure connection allows your
              applications to send messages through your phone.
            </p>

            <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
              <div className='bg-card p-5 rounded-lg border hover:border-primary/30 transition-colors'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-medium'>QR Code Method</h3>
                  <span className='px-2 py-0.5 bg-primary/10 rounded text-xs text-primary'>
                    Recommended
                  </span>
                </div>
                <ol className='list-decimal ml-5 text-sm space-y-2'>
                  <li>Go to TextBee Dashboard</li>
                  <li>Click "Register Device"</li>
                  <li>Scan QR with app</li>
                </ol>
              </div>

              <div className='bg-card p-5 rounded-lg border'>
                <h3 className='font-medium mb-4'>Manual Method</h3>
                <ol className='list-decimal ml-5 text-sm space-y-2'>
                  <li>Generate API key from dashboard</li>
                  <li>Open TextBee app</li>
                  <li>Enter the API key</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div id='step-3' className='pb-8 border-t pt-4 group'>
          <div className='flex items-center gap-3 mb-6 justify-center'>
            <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shadow-sm'>
              3
            </div>
            <h2 className='text-2xl font-semibold'>Send Your First SMS</h2>
          </div>

          <div className='space-y-4'>
            <p className='text-muted-foreground mb-4 text-center mx-auto max-w-3xl'>
              Start sending SMS messages through TextBee using either our
              intuitive dashboard or direct API integration. Both methods
              provide reliable message delivery with delivery status tracking.
            </p>

            <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
              <div className='bg-card p-5 rounded-lg border'>
                <h3 className='font-medium mb-3 text-primary flex items-center gap-2'>
                  Dashboard Method
                </h3>
                <div className='bg-muted/50 p-4 rounded-md'>
                  <ol className='list-decimal ml-5 text-sm space-y-2'>
                    <li>Go to "Send SMS" section</li>
                    <li>Enter recipient(s)</li>
                    <li>Type your message</li>
                    <li>Click "Send"</li>
                  </ol>
                </div>
              </div>

              <div className='bg-card p-5 rounded-lg border'>
                <h3 className='font-medium mb-3 text-primary flex items-center gap-2'>
                  API Method
                </h3>
                <pre className='overflow-x-auto rounded-md bg-slate-950 p-3 text-xs'>
                  <code className='font-mono text-white'>
                    {`fetch("https://api.textbee.dev/api/v1/gateway/devices/{ID}/send-sms", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
  body: JSON.stringify({
    recipients: ['+1234567890'],
    message: 'Hello!'
  })
})`}
                  </code>
                </pre>
              </div>
            </div>

            <p className='text-sm text-muted-foreground text-center mx-auto max-w-3xl'>
              With TextBee, your messages are sent directly through your Android
              device, using your existing mobile plan. This keeps costs low
              while maintaining high deliverability rates across all carriers.
            </p>
          </div>
        </div>

        <div id='step-4' className='pb-8 border-t pt-4 group'>
          <div className='flex items-center gap-3 mb-6 justify-center'>
            <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shadow-sm'>
              4
            </div>
            <h2 className='text-2xl font-semibold'>Receive SMS Messages</h2>
          </div>

          <div className='space-y-4'>
            <p className='text-muted-foreground mb-4 text-center mx-auto max-w-3xl'>
              Enable two-way communication by configuring TextBee to forward
              incoming SMS messages to your application. This is essential for
              interactive workflows, verification codes, and customer
              engagement.
            </p>

            <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
              <div className='bg-card p-5 rounded-lg border'>
                <h3 className='font-medium mb-3 text-primary'>Enable in App</h3>
                <div className='bg-muted/50 p-4 rounded-md'>
                  <ol className='list-decimal ml-5 text-sm space-y-2'>
                    <li>Open the TextBee App</li>
                    <li>Go to Settings</li>
                    <li>Toggle "Receive SMS" on</li>
                  </ol>
                </div>
              </div>

              <div className='bg-card p-5 rounded-lg border'>
                <h3 className='font-medium mb-3 text-primary'>
                  Retrieve via API
                </h3>
                <pre className='overflow-x-auto rounded-md bg-slate-950 p-3 text-xs'>
                  <code className='font-mono text-white'>
                    {`fetch("https://api.textbee.dev/api/v1/gateway/devices/{ID}/get-received-sms", {
  headers: { 'x-api-key': API_KEY }
})`}
                  </code>
                </pre>
              </div>
            </div>

            <p className='text-sm text-muted-foreground text-center mx-auto max-w-3xl'>
              Received messages are securely forwarded to TextBee's servers and
              can be accessed via the dashboard, API, or automatically sent to
              your webhook endpoints for real-time processing.
            </p>
          </div>
        </div>

        <div id='step-5' className='pb-6 border-t pt-4 group'>
          <div className='flex items-center gap-3 mb-6 justify-center'>
            <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shadow-sm'>
              5
            </div>
            <h2 className='text-2xl font-semibold'>Advanced Features</h2>
          </div>

          <div className='space-y-4'>
            <p className='text-muted-foreground mb-4 text-center mx-auto max-w-3xl'>
              Once you've mastered the basics, explore TextBee's advanced
              capabilities to enhance your SMS integration. These features help
              scale your messaging operations and automate complex workflows.
            </p>

            <div className='grid sm:grid-cols-2 gap-3 mb-6 max-w-4xl mx-auto'>
              <div className='flex items-start gap-2 p-3 bg-card rounded-md border'>
                <div className='h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mt-0.5'>
                  •
                </div>
                <div>
                  <p className='font-medium'>Bulk SMS</p>
                  <p className='text-xs text-muted-foreground'>
                    Send to multiple recipients with a single API call for
                    efficient message broadcasting
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2 p-3 bg-card rounded-md border'>
                <div className='h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mt-0.5'>
                  •
                </div>
                <div>
                  <p className='font-medium'>Webhooks</p>
                  <p className='text-xs text-muted-foreground'>
                    Configure event-driven notifications for real-time updates
                    on message status
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2 p-3 bg-card rounded-md border'>
                <div className='h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mt-0.5'>
                  •
                </div>
                <div>
                  <p className='font-medium'>Multiple Devices</p>
                  <p className='text-xs text-muted-foreground'>
                    Connect several phones to increase throughput and add
                    redundancy
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2 p-3 bg-card rounded-md border'>
                <div className='h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mt-0.5'>
                  •
                </div>
                <div>
                  <p className='font-medium'>Self-hosting</p>
                  <p className='text-xs text-muted-foreground'>
                    Deploy TextBee on your own infrastructure for complete
                    control
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-md border border-primary/20 max-w-4xl mx-auto'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <BookOpen className='h-4 w-4 text-primary' />
                  <span className='font-medium'>Ready to explore more?</span>
                </div>
                <Link
                  href='/use-cases'
                  className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
                >
                  <span>Use Cases</span>
                  <ArrowRightCircle className='h-3 w-3' />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id='pro-plan'
        className='my-16 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent rounded-xl overflow-hidden border border-primary/20 shadow-sm max-w-4xl mx-auto'
      >
        <div className='p-1 bg-primary/20'></div>
        <div className='px-6 py-8 md:px-8 text-center'>
          <div className='flex items-center gap-2 mb-4 justify-center'>
            <SparkleIcon className='h-5 w-5 text-primary' />
            <h2 className='text-2xl font-bold'>TextBee Pro</h2>
          </div>

          <p className='text-lg mb-4 mx-auto max-w-2xl'>
            Upgrade to TextBee Pro for enhanced features and priority support.
          </p>

          <div className='grid md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto text-left'>
            <div className='space-y-3'>
              <div className='flex items-start gap-2'>
                <CheckCircle2 className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                <span>Unlimited devices and higher sending limits</span>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle2 className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                <span>Advanced analytics and delivery reporting</span>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle2 className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                <span>Message scheduling and template management</span>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex items-start gap-2'>
                <CheckCircle2 className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                <span>Priority support with faster response times</span>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle2 className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                <span>Custom webhooks for advanced integrations</span>
              </div>
              <div className='flex items-start gap-2'>
                <CheckCircle2 className='h-5 w-5 text-primary shrink-0 mt-0.5' />
                <span>White-labeled SMS for business applications</span>
              </div>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row sm:items-center gap-4 justify-center max-w-xl mx-auto'>
            <div className='sm:flex-1 text-center sm:text-left'>
              <div className='flex items-baseline gap-1 mb-1 justify-center sm:justify-start'>
                <span className='text-3xl font-bold'>$29</span>
                <span className='text-muted-foreground'>/month</span>
              </div>
              <p className='text-sm text-muted-foreground'>
                Cancel anytime. No long-term contracts.
              </p>
            </div>
            <a
              href='https://textbee.dev/pricing'
              className='px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-center'
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>

      <div className='mb-16 border-t pt-8 max-w-4xl mx-auto'>
        <h2 className='text-2xl font-semibold mb-4 text-center'>
          Why Choose TextBee SMS Gateway?
        </h2>
        <div className='grid md:grid-cols-2 gap-8'>
          <div>
            <h3 className='text-lg font-medium mb-2 text-center'>
              Cost-Effective SMS Solution
            </h3>
            <p className='text-muted-foreground text-sm mb-4 text-center'>
              TextBee eliminates the need for expensive SMS API services or
              telecom contracts. By using your existing phone and mobile plan,
              you can send SMS messages at standard rates without additional
              per-message fees from third-party providers.
            </p>

            <h3 className='text-lg font-medium mb-2 text-center'>
              Easy Integration
            </h3>
            <p className='text-muted-foreground text-sm text-center'>
              Our RESTful API makes integration simple for developers using any
              programming language. TextBee works seamlessly with web
              applications, mobile apps, and backend services through standard
              HTTP requests.
            </p>
          </div>

          <div>
            <h3 className='text-lg font-medium mb-2 text-center'>
              Perfect For
            </h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-primary shrink-0 mt-0.5' />
                <span>
                  <span className='font-medium'>
                    Two-factor authentication (2FA)
                  </span>{' '}
                  - Secure user accounts with SMS verification codes
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-primary shrink-0 mt-0.5' />
                <span>
                  <span className='font-medium'>Appointment reminders</span> -
                  Reduce no-shows with automated SMS notifications
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-primary shrink-0 mt-0.5' />
                <span>
                  <span className='font-medium'>Order updates</span> - Keep
                  customers informed about their purchases
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-primary shrink-0 mt-0.5' />
                <span>
                  <span className='font-medium'>Marketing campaigns</span> -
                  Engage customers with promotional messages
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle2 className='h-4 w-4 text-primary shrink-0 mt-0.5' />
                <span>
                  <span className='font-medium'>Alerts and notifications</span>{' '}
                  - Send time-sensitive information instantly
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className='mt-12 pt-6 border-t'>
        <div className='max-w-lg mx-auto bg-card rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left'>
          <div className='flex flex-col items-center sm:items-start'>
            <p className='font-medium mb-1'>Need help?</p>
            <p className='text-xs text-muted-foreground'>
              Our support team is ready to assist you
            </p>
          </div>
          <div className='flex gap-3 justify-center'>
            <a
              href='mailto:contact@textbee.dev'
              className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-muted transition-colors text-sm'
            >
              <ExternalLink className='h-3.5 w-3.5' />
              <span>Email</span>
            </a>
            <a
              href='https://docs.textbee.dev'
              className='inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-muted transition-colors text-sm'
            >
              <BookOpen className='h-3.5 w-3.5' />
              <span>Docs</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
