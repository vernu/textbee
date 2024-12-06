import { Routes } from '@/config/routes'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion'

export default function HowItWorksSection() {
  return (
    <section
      id='how-it-works'
      className='container mx-auto py-24 px-4 sm:px-6 lg:px-8 max-w-7xl bg-gray-50 dark:bg-muted rounded-2xl'
    >
      <div className='mx-auto max-w-[58rem]'>
        <h2 className='text-3xl font-bold text-center mb-8'>How It Works</h2>
        <p className='text-center mb-12 text-gray-500'>
          How it works is simple. You install the app on your Android device,
          and it will turn your device into a SMS Gateway. You can then use the
          API to send SMS messages from your web applications.
        </p>
        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='step-1'>
            <AccordionTrigger>
              Step 1: Download The Android App
            </AccordionTrigger>
            <AccordionContent>
              Download the Android App from{' '}
              <a href={Routes.downloadAndroidApp} target='_blank'>
                {Routes.downloadAndroidApp}
              </a>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='step-2'>
            <AccordionTrigger>Step 2: Generate an API key</AccordionTrigger>
            <AccordionContent>
              Generate an API key from the dashboard
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='step-3'>
            <AccordionTrigger>Step 3: Scan the QR code</AccordionTrigger>
            <AccordionContent>
              Open the textbee mobile app and scan the QR code or enter your api
              key manually and enable the gateway app
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='step-4'>
            <AccordionTrigger>Step 4: Start sending</AccordionTrigger>
            <AccordionContent>
              Start sending SMS messages from the dashboard or using the API
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}
