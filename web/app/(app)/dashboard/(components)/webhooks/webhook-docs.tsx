'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code } from '@/components/ui/code'
import { AlertCircle } from 'lucide-react'

const SAMPLE_PAYLOAD = {
  smsId: 'smsId',
  sender: '+123456789',
  message: 'message',
  receivedAt: 'datetime',
  deviceId: 'deviceId',
  webhookSubscriptionId: 'webhookSubscriptionId',
  webhookEvent: 'sms.received',
}

const VERIFICATION_CODE = `
// Node.js example using crypto
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  const signatureHash = signature.split('=')[1];
  
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash),
    Buffer.from(digest)
  );
}

// Express middleware example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-signature'];
  const payload = req.body;
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process the webhook
  console.log('Webhook verified:', payload);
  res.status(200).send('OK');
});
`

const PYTHON_CODE = `
# Python example using hmac
import hmac
import hashlib
import json
from flask import Flask, request

app = Flask(__name__)

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode('utf-8'),
        json.dumps(payload).encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature.split('=')[1], expected)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Signature')
    if not verify_signature(request.json, signature, WEBHOOK_SECRET):
        return 'Invalid signature', 401
        
    # Process the webhook
    print('Webhook verified:', request.json)
    return 'OK', 200
`

export function WebhookDocs() {
  return (
    <Accordion type='multiple' className='w-full space-y-2 sm:space-y-4'>
      <AccordionItem value='delivery' className='border rounded-lg'>
        <AccordionTrigger className='px-3 sm:px-4 hover:no-underline [&[data-state=open]>div]:bg-muted'>
          <div className='flex items-center gap-2 py-2 -my-2 px-2 rounded-md'>
            <AlertCircle className='h-4 w-4' />
            <span className='text-sm sm:text-base'>Webhook Delivery Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className='px-3 sm:px-4 pb-4'>
          <div className='space-y-2 mt-2 text-sm text-muted-foreground'>
            <p>
              When a new SMS is received, we&apos;ll send a POST request to your
              webhook URL with the event data. Your endpoint should:
            </p>
            <ul className='list-disc pl-6 space-y-1'>
              <li>Accept POST requests</li>
              <li>Return a 2XX status code to acknowledge receipt</li>
              <li>Process the request within 10 seconds</li>
            </ul>
            <p className='mt-2'>
              If we don&apos;t receive a successful response, we&apos;ll retry the
              delivery at increasing intervals: 3 minutes, 5 minutes, 30 minutes,
              1 hour, 6 hours, 1 day, 3 days, 7 days, 30 days.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value='implementation' className='border rounded-lg'>
        <AccordionTrigger className='px-4 hover:no-underline [&[data-state=open]>div]:bg-muted'>
          <div className='flex items-center gap-2 py-2 -my-2 px-2 rounded-md'>
            <AlertCircle className='h-4 w-4' />
            <span>Security & Implementation Guide</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className='px-4 pb-4'>
          <Tabs defaultValue='overview' className='w-full mt-4'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='payload'>Payload</TabsTrigger>
              <TabsTrigger value='verification'>Verification</TabsTrigger>
            </TabsList>

            <TabsContent value='overview'>
              <div className='space-y-2 mt-4 text-sm text-muted-foreground'>
                <p>Each webhook request includes:</p>
                <ul className='list-disc pl-6 space-y-1'>
                  <li>Payload in JSON format</li>
                  <li>X-Signature header for verification</li>
                  <li>
                    Signature format: sha256=HMAC_SHA256(payload, secret)
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value='payload'>
              <div className='space-y-4 mt-4'>
                <h4 className='text-sm font-medium'>Sample Payload</h4>
                <Code>{JSON.stringify(SAMPLE_PAYLOAD, null, 2)}</Code>
              </div>
            </TabsContent>

            <TabsContent value='verification'>
              <div className='space-y-4 mt-4'>
                <Tabs defaultValue='node'>
                  <TabsList>
                    <TabsTrigger value='node'>Node.js</TabsTrigger>
                    <TabsTrigger value='python'>Python</TabsTrigger>
                  </TabsList>

                  <TabsContent value='node'>
                    <Code>{VERIFICATION_CODE}</Code>
                  </TabsContent>

                  <TabsContent value='python'>
                    <Code>{PYTHON_CODE}</Code>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
