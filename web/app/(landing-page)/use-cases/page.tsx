import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import {
  ShieldCheck,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  Megaphone,
  HeadsetIcon,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Use Cases | TextBee',
  description:
    'Explore various use cases and applications for TextBee SMS Gateway Platform',
}

export default function UseCasesPage() {
  return (
    <>
      <div className='container max-w-7xl mx-auto py-10 px-4 md:px-12'>
        <div className='rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-background p-8 mb-12 mx-auto'>
          <h1 className='scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl mb-4 text-center'>
            TextBee Use Cases
          </h1>
          <p className='text-xl leading-relaxed max-w-3xl mx-auto text-center'>
            Discover how businesses and developers leverage TextBee SMS Gateway
            for a wide variety of applications. Get inspired by these common use
            cases and implementations.
          </p>
        </div>

        <Card className='border-none shadow-none mx-auto'>
          <CardContent className='space-y-10 px-0'>
            <div className='grid gap-8 md:grid-cols-2 mx-auto'>
              <div className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mt-8 -mr-8'></div>

                <div className='flex items-center gap-4 mb-5'>
                  <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <ShieldCheck className='h-6 w-6 text-primary' />
                  </div>
                  <h2 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
                    Two-factor Authentication (2FA)
                  </h2>
                </div>

                <p className='leading-7 mb-5 text-muted-foreground'>
                  Enhance your application's security by implementing SMS-based
                  two-factor authentication. Add an extra layer of verification
                  to protect user accounts.
                </p>

                <div className='bg-muted p-4 rounded-lg mb-5'>
                  <h3 className='font-medium text-base mb-2'>
                    Implementation Steps:
                  </h3>
                  <ol className='ml-6 list-decimal space-y-1'>
                    <li>Generate a random verification code for the user</li>
                    <li>Send the code via SMS using TextBee API</li>
                    <li>Verify the code entered by the user</li>
                  </ol>
                </div>

                <div className='relative'>
                  <div className='flex items-center gap-1 text-xs text-muted-foreground mb-2'>
                    <span className='px-2 py-0.5 bg-primary/10 rounded text-primary font-medium'>
                      JavaScript
                    </span>
                    <span className='text-muted-foreground'>Example:</span>
                  </div>
                  <pre className='overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs'>
                    <code className='font-mono text-white'>
                      {`// Send 2FA code
const verificationCode = generateRandomCode();
await axios.post(\`https://api.textbee.dev/api/v1/gateway/devices/\${DEVICE_ID}/send-sms\`, {
  recipients: [ user.phoneNumber ],
  message: \`Your verification code is: \${verificationCode}\`
}, {
  headers: { 'x-api-key': API_KEY }
});`}
                    </code>
                  </pre>
                  <button className='absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-slate-300'
                    >
                      <rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
                      <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
                    </svg>
                  </button>
                </div>
              </div>
              <div className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mt-8 -mr-8'></div>

                <div className='flex items-center gap-4 mb-5'>
                  <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <ShoppingBag className='h-6 w-6 text-primary' />
                  </div>
                  <h2 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
                    Order Notifications
                  </h2>
                </div>

                <p className='leading-7 mb-5 text-muted-foreground'>
                  Keep customers informed about their orders with real-time SMS
                  updates. Improve customer experience with timely notifications
                  throughout the order lifecycle.
                </p>

                <div className='grid grid-cols-2 gap-2 mb-5'>
                  <div className='border rounded-lg p-3 bg-background'>
                    <h3 className='text-sm font-medium mb-1'>
                      Order Confirmation
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Send details after purchase
                    </p>
                  </div>
                  <div className='border rounded-lg p-3 bg-background'>
                    <h3 className='text-sm font-medium mb-1'>
                      Shipping Updates
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Notify when order ships
                    </p>
                  </div>
                  <div className='border rounded-lg p-3 bg-background'>
                    <h3 className='text-sm font-medium mb-1'>
                      Delivery Status
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      Alert when delivered
                    </p>
                  </div>
                  <div className='border rounded-lg p-3 bg-background'>
                    <h3 className='text-sm font-medium mb-1'>Order Changes</h3>
                    <p className='text-xs text-muted-foreground'>
                      Inform of modifications
                    </p>
                  </div>
                </div>

                <div className='relative'>
                  <div className='flex items-center gap-1 text-xs text-muted-foreground mb-2'>
                    <span className='px-2 py-0.5 bg-primary/10 rounded text-primary font-medium'>
                      JavaScript
                    </span>
                    <span className='text-muted-foreground'>Example:</span>
                  </div>
                  <pre className='overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs'>
                    <code className='font-mono text-white'>
                      {`// Send order confirmation
await axios.post(\`https://api.textbee.dev/api/v1/gateway/devices/\${DEVICE_ID}/send-sms\`, {
  recipients: [ customer.phoneNumber ],
  message: \`Order #\${orderNumber} confirmed! Expected delivery: \${deliveryDate}. Track at: \${trackingUrl}\`
}, {
  headers: { 'x-api-key': API_KEY }
});`}
                    </code>
                  </pre>
                  <button className='absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-slate-300'
                    >
                      <rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
                      <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
                    </svg>
                  </button>
                </div>
              </div>

              <div className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mt-8 -mr-8'></div>

                <div className='flex items-center gap-4 mb-5'>
                  <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <Calendar className='h-6 w-6 text-primary' />
                  </div>
                  <h2 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
                    Appointment Reminders
                  </h2>
                </div>

                <p className='leading-7 mb-5 text-muted-foreground'>
                  Reduce no-shows by sending automated appointment reminders to
                  clients. Perfect for medical practices, salons, consultants,
                  and service businesses.
                </p>

                <div className='bg-gradient-to-r from-primary/10 to-background p-4 rounded-lg mb-5'>
                  <h3 className='font-medium text-base mb-2'>Key Features:</h3>
                  <ul className='ml-6 list-disc space-y-1'>
                    <li>Scheduled reminders (24h, 1h before appointments)</li>
                    <li>Interactive responses (reply to reschedule/cancel)</li>
                    <li>Calendar integration</li>
                  </ul>
                </div>

                <div className='relative'>
                  <div className='flex items-center gap-1 text-xs text-muted-foreground mb-2'>
                    <span className='px-2 py-0.5 bg-primary/10 rounded text-primary font-medium'>
                      JavaScript
                    </span>
                    <span className='text-muted-foreground'>Example:</span>
                  </div>
                  <pre className='overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs'>
                    <code className='font-mono text-white'>
                      {`// Schedule reminder job
scheduler.scheduleJob(reminderTime, async () => {
  await axios.post(\`https://api.textbee.dev/api/v1/gateway/devices/\${DEVICE_ID}/send-sms\`, {
    recipients: [ appointment.phoneNumber ],
    message: \`Reminder: Your appointment is tomorrow at \${appointment.time}. Reply CONFIRM to confirm or RESCHEDULE to change.\`
  }, {
    headers: { 'x-api-key': API_KEY }
  });
});`}
                    </code>
                  </pre>
                  <button className='absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-slate-300'
                    >
                      <rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
                      <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
                    </svg>
                  </button>
                </div>
              </div>

              <div className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mt-8 -mr-8'></div>

                <div className='flex items-center gap-4 mb-5'>
                  <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <AlertTriangle className='h-6 w-6 text-primary' />
                  </div>
                  <h2 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
                    Emergency Alerts
                  </h2>
                </div>

                <p className='leading-7 mb-5 text-muted-foreground'>
                  Send critical notifications and emergency alerts to large
                  groups of people quickly. Perfect for natural disasters,
                  emergencies, and critical business communications.
                </p>

                <div className='bg-gradient-to-r from-primary/10 to-background p-4 rounded-lg mb-5'>
                  <h3 className='font-medium text-base mb-2'>Applications:</h3>
                  <ul className='ml-6 list-disc space-y-1'>
                    <li>Weather emergencies</li>
                    <li>Campus/school alerts</li>
                    <li>IT system outages</li>
                    <li>Critical business communications</li>
                  </ul>
                </div>

                <div className='relative'>
                  <div className='flex items-center gap-1 text-xs text-muted-foreground mb-2'>
                    <span className='px-2 py-0.5 bg-primary/10 rounded text-primary font-medium'>
                      JavaScript
                    </span>
                    <span className='text-muted-foreground'>Example:</span>
                  </div>
                  <pre className='overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs'>
                    <code className='font-mono text-white'>
                      {`// Send bulk emergency alert
const recipients = await getUserPhoneNumbers(affectedRegion);
await axios.post(\`https://api.textbee.dev/api/v1/gateway/devices/\${DEVICE_ID}/send-bulk-sms\`, {
  messageTemplate: \`ALERT: \${emergencyMessage}. Stay safe.\`,
  messages: [{
    recipients: recipients,
  }]
}, {
  headers: { 'x-api-key': API_KEY }
});`}
                    </code>
                  </pre>
                  <button className='absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-slate-300'
                    >
                      <rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
                      <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
                    </svg>
                  </button>
                </div>
              </div>

              <div className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mt-8 -mr-8'></div>

                <div className='flex items-center gap-4 mb-5'>
                  <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <Megaphone className='h-6 w-6 text-primary' />
                  </div>
                  <h2 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
                    Marketing Campaigns
                  </h2>
                </div>

                <p className='leading-7 mb-5 text-muted-foreground'>
                  Run targeted SMS marketing campaigns to engage customers and
                  drive sales. Perfect for promotions, event announcements, and
                  customer surveys.
                </p>

                <div className='bg-gradient-to-r from-primary/10 to-background p-4 rounded-lg mb-5'>
                  <h3 className='font-medium text-base mb-2'>
                    Campaign Types:
                  </h3>
                  <ul className='ml-6 list-disc space-y-1'>
                    <li>Promotional offers and discounts</li>
                    <li>New product announcements</li>
                    <li>Event invitations</li>
                    <li>Customer surveys</li>
                  </ul>
                </div>

                <div className='bg-amber-50 dark:bg-amber-950 p-4 rounded-lg my-4'>
                  <p className='text-amber-800 dark:text-amber-200 text-sm'>
                    <strong>Note:</strong> Always ensure you have proper consent
                    and comply with SMS marketing regulations in your region.
                  </p>
                </div>
              </div>

              <div className='rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mt-8 -mr-8'></div>

                <div className='flex items-center gap-4 mb-5'>
                  <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                    <HeadsetIcon className='h-6 w-6 text-primary' />
                  </div>
                  <h2 className='scroll-m-20 text-2xl font-semibold tracking-tight'>
                    Customer Support
                  </h2>
                </div>

                <p className='leading-7 mb-5 text-muted-foreground'>
                  Provide customer support through two-way SMS communication.
                  Perfect for handling customer inquiries and feedback.
                </p>

                <div className='bg-gradient-to-r from-primary/10 to-background p-4 rounded-lg mb-5'>
                  <h3 className='font-medium text-base mb-2'>
                    Implementation Steps:
                  </h3>
                  <ol className='ml-6 list-decimal space-y-1'>
                    <li>Configure webhook for incoming SMS</li>
                    <li>Process and route messages to support agents</li>
                    <li>Send automated responses for common queries</li>
                    <li>Track conversation history</li>
                  </ol>
                </div>

                <div className='relative'>
                  <div className='flex items-center gap-1 text-xs text-muted-foreground mb-2'>
                    <span className='px-2 py-0.5 bg-primary/10 rounded text-primary font-medium'>
                      JavaScript
                    </span>
                    <span className='text-muted-foreground'>Example:</span>
                  </div>
                  <pre className='overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs'>
                    <code className='font-mono text-white'>
                      {`// Check for new messages
const messages = await axios.get(
  \`https://api.textbee.dev/api/v1/gateway/devices/\${DEVICE_ID}/get-received-sms\`,
  { headers: { 'x-api-key': API_KEY } }
);

// Process and respond to messages
for (const msg of messages.data) {
  const response = await generateSupportResponse(msg.message);
  await sendReply(msg.sender, response);
}`}
                    </code>
                  </pre>
                  <button className='absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='text-slate-300'
                    >
                      <rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
                      <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className='mt-16 space-y-6 mx-auto'>
              <div className='flex items-center gap-3 mb-6 justify-center'>
                <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                  <ExternalLink className='h-4 w-4 text-primary' />
                </div>
                <h2 className='scroll-m-20 text-3xl font-semibold tracking-tight'>
                  Custom Integrations
                </h2>
              </div>

              <p className='leading-7 text-muted-foreground max-w-3xl mx-auto text-center'>
                TextBee can be integrated with various platforms and services.
                Our REST API allows you to create custom integrations for almost
                any application, automating SMS sending and receiving based on
                triggers in your existing systems.
              </p>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 my-8 mx-auto'>
                <div className='p-6 border rounded-xl text-center hover:border-primary/50 hover:shadow-md transition-all bg-card'>
                  <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-6 w-6 text-blue-700 dark:text-blue-300'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                      <circle cx='9' cy='7' r='4' />
                      <path d='M22 21v-2a4 4 0 0 0-3-3.87' />
                      <path d='M16 3.13a4 4 0 0 1 0 7.75' />
                    </svg>
                  </div>
                  <p className='font-medium text-lg'>CRM Systems</p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    Connect SMS messaging with customer records
                  </p>
                </div>

                <div className='p-6 border rounded-xl text-center hover:border-primary/50 hover:shadow-md transition-all bg-card'>
                  <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-6 w-6 text-purple-700 dark:text-purple-300'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <rect width='18' height='18' x='3' y='4' rx='2' ry='2' />
                      <line x1='16' x2='16' y1='2' y2='6' />
                      <line x1='8' x2='8' y1='2' y2='6' />
                      <line x1='3' x2='21' y1='10' y2='10' />
                      <path d='M8 14h.01' />
                      <path d='M12 14h.01' />
                      <path d='M16 14h.01' />
                      <path d='M8 18h.01' />
                      <path d='M12 18h.01' />
                      <path d='M16 18h.01' />
                    </svg>
                  </div>
                  <p className='font-medium text-lg'>Booking Software</p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    Automate appointment confirmations
                  </p>
                </div>

                <div className='p-6 border rounded-xl text-center hover:border-primary/50 hover:shadow-md transition-all bg-card'>
                  <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-6 w-6 text-green-700 dark:text-green-300'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <circle cx='8' cy='21' r='1' />
                      <circle cx='19' cy='21' r='1' />
                      <path d='M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12' />
                    </svg>
                  </div>
                  <p className='font-medium text-lg'>E-commerce</p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    Send order & shipping updates
                  </p>
                </div>

                <div className='p-6 border rounded-xl text-center hover:border-primary/50 hover:shadow-md transition-all bg-card'>
                  <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-6 w-6 text-amber-700 dark:text-amber-300'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <rect width='18' height='18' x='3' y='3' rx='2' />
                      <path d='M12 8v8' />
                      <path d='m8.5 14 7-4' />
                      <path d='m8.5 10 7 4' />
                    </svg>
                  </div>
                  <p className='font-medium text-lg'>Automation Tools</p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    Integrate with Zapier, IFTTT, etc.
                  </p>
                </div>
              </div>

              <div className='mt-6 grid md:grid-cols-2 gap-8 mx-auto'>
                <div className='bg-muted p-6 rounded-xl'>
                  <h3 className='text-xl font-medium mb-3'>Webhooks Support</h3>
                  <p className='text-muted-foreground mb-4'>
                    Configure webhooks to receive notifications when SMS events
                    occur. Perfect for event-driven architectures and real-time
                    applications.
                  </p>
                  <div className='text-xs p-2 bg-slate-200 dark:bg-slate-800 rounded-lg font-mono overflow-x-auto'>
                    POST
                    https://your-server.com/webhook?event=sms_received&sender=+1234567890
                  </div>
                </div>

                <div className='bg-muted p-6 rounded-xl'>
                  <h3 className='text-xl font-medium mb-3'>
                    API Documentation
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    Our comprehensive API documentation provides all the details
                    you need to integrate TextBee with your applications and
                    services.
                  </p>
                  <a
                    href='https://docs.textbee.dev'
                    className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm'
                  >
                    <span>View API Documentation</span>
                    <ArrowRight className='h-3.5 w-3.5' />
                  </a>
                </div>
              </div>
            </div>

            <div className='p-8 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-xl mt-12 mx-auto'>
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div>
                  <h2 className='scroll-m-20 text-2xl font-semibold tracking-tight mb-2'>
                    Ready to implement these use cases?
                  </h2>
                  <p className='leading-7 text-muted-foreground max-w-2xl'>
                    Follow our step-by-step quickstart guide to set up TextBee
                    and start sending SMS messages in minutes. Whether you're
                    implementing 2FA, appointment reminders, or complex
                    integrations, we've got you covered.
                  </p>
                </div>
                <div className='flex flex-col sm:flex-row gap-4'>
                  <Link
                    href='/quickstart'
                    className='inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
                  >
                    <span>Quickstart Guide</span>
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                  <a
                    href='mailto:contact@textbee.dev'
                    className='inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-background border hover:bg-muted transition-colors'
                  >
                    <span>Contact Support</span>
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
