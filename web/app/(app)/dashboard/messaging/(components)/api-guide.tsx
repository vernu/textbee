'use client'

import { useState } from 'react'
import { Code, Terminal, Check, Copy, ArrowRight, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../../components/ui/collapsible'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Link from 'next/link'

export default function ApiGuide() {
  const [activeTab, setActiveTab] = useState('send-sms')
  const [activeLangTab, setActiveLangTab] = useState('node')
  const [copiedIndex, setCopiedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)

  const handleCopy = (index: number, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(-1), 2000)
  }

  const apiEndpoints = [
    {
      id: 'send-sms',
      title: 'Send SMS',
      description: 'Send SMS messages to one or more recipients',
      endpoint: '/api/v1/gateway/devices/:id/send-sms',
      badge: { color: 'green', text: 'POST' },
      request: {
        node: {
          language: 'javascript',
          code: `import axios from 'axios'

const BASE_URL = 'https://api.textbee.dev/api/v1'
const API_KEY = 'YOUR_API_KEY'
const DEVICE_ID = 'YOUR_DEVICE_ID'

const response = await axios.post(
  \`\${BASE_URL}/gateway/devices/\${DEVICE_ID}/send-sms\`,
  {
    recipients: [ '+1234567890' ],
    message: 'Hello from TextBee!'
  },
  { headers: { 'x-api-key': API_KEY } }
)

console.log(response.data)`
        },
        python: {
          language: 'python',
          code: `import requests

BASE_URL = 'https://api.textbee.dev/api/v1'
API_KEY = 'YOUR_API_KEY'
DEVICE_ID = 'YOUR_DEVICE_ID'

response = requests.post(
  f'{BASE_URL}/gateway/devices/{DEVICE_ID}/send-sms',
  json={
    'recipients': ['+1234567890'],
    'message': 'Hello from TextBee!'
  },
  headers={'x-api-key': API_KEY}
)

print(response.json())`
        },
        curl: {
          language: 'bash',
          code: `curl -X POST "https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/send-sms" \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "recipients": [ "+1234567890" ],
    "message": "Hello from TextBee!"
  }'`
        }
      },
      response: {
        language: 'json',
        code: `{
  "data": {
    "_id": "sms_1234567890",
    "message": "Hello from TextBee!",
    "recipients": ["+1234567890"],
    "status": "PENDING",
    "createdAt": "2023-09-15T14:23:45Z"
  }
}`
      }
    },
    {
      id: 'get-sms',
      title: 'Get SMS by ID',
      description: 'Retrieve details and status of a specific SMS message',
      endpoint: '/api/v1/gateway/devices/:id/sms/:smsId',
      badge: { color: 'blue', text: 'GET' },
      request: {
        node: {
          language: 'javascript',
          code: `import axios from 'axios'

const BASE_URL = 'https://api.textbee.dev/api/v1'
const API_KEY = 'YOUR_API_KEY'
const DEVICE_ID = 'YOUR_DEVICE_ID'
const SMS_ID = 'YOUR_SMS_ID'

const response = await axios.get(
  \`\${BASE_URL}/gateway/devices/\${DEVICE_ID}/sms/\${SMS_ID}\`,
  { headers: { 'x-api-key': API_KEY } }
)

console.log(response.data)`
        },
        python: {
          language: 'python',
          code: `import requests

BASE_URL = 'https://api.textbee.dev/api/v1'
API_KEY = 'YOUR_API_KEY'
DEVICE_ID = 'YOUR_DEVICE_ID'
SMS_ID = 'YOUR_SMS_ID'

response = requests.get(
  f'{BASE_URL}/gateway/devices/{DEVICE_ID}/sms/{SMS_ID}',
  headers={'x-api-key': API_KEY}
)

print(response.json())`
        },
        curl: {
          language: 'bash',
          code: `curl -X GET "https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/sms/YOUR_SMS_ID" \\
  -H 'x-api-key: YOUR_API_KEY'`
        }
      },
      response: {
        language: 'json',
        code: `{
  "data": {
    "_id": "sms_1234567890",
    "message": "Hello from TextBee!",
    "recipient": "+1234567890",
    "status": "DELIVERED",
    "sentAt": "2023-09-15T14:23:45Z",
    "deliveredAt": "2023-09-15T14:23:48Z"
  }
}`
      }
    },
    {
      id: 'get-batch',
      title: 'Get SMS Batch',
      description: 'Retrieve details and status of a batch of SMS messages',
      endpoint: '/api/v1/gateway/devices/:id/sms-batch/:batchId',
      badge: { color: 'blue', text: 'GET' },
      request: {
        node: {
          language: 'javascript',
          code: `import axios from 'axios'

const BASE_URL = 'https://api.textbee.dev/api/v1'
const API_KEY = 'YOUR_API_KEY'
const DEVICE_ID = 'YOUR_DEVICE_ID'
const BATCH_ID = 'YOUR_BATCH_ID'

const response = await axios.get(
  \`\${BASE_URL}/gateway/devices/\${DEVICE_ID}/sms-batch/\${BATCH_ID}\`,
  { headers: { 'x-api-key': API_KEY } }
)

console.log(response.data)`
        },
        python: {
          language: 'python',
          code: `import requests

BASE_URL = 'https://api.textbee.dev/api/v1'
API_KEY = 'YOUR_API_KEY'
DEVICE_ID = 'YOUR_DEVICE_ID'
BATCH_ID = 'YOUR_BATCH_ID'

response = requests.get(
  f'{BASE_URL}/gateway/devices/{DEVICE_ID}/sms-batch/{BATCH_ID}',
  headers={'x-api-key': API_KEY}
)

print(response.json())`
        },
        curl: {
          language: 'bash',
          code: `curl -X GET "https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/sms-batch/YOUR_BATCH_ID" \\
  -H 'x-api-key: YOUR_API_KEY'`
        }
      },
      response: {
        language: 'json',
        code: `{
  "data": {
    "batch": {
      "_id": "batch_9876543210",
      "createdAt": "2023-09-15T14:23:45Z"
    },
    "messages": [
      {
        "_id": "sms_1234567890",
        "recipient": "+1234567890",
        "message": "Hello from TextBee!",
        "status": "DELIVERED",
        "sentAt": "2023-09-15T14:23:45Z",
        "deliveredAt": "2023-09-15T14:23:48Z",
      },
      {
        "_id": "sms_0987654321",
        "recipient": "+0987654321",
        "message": "Hello from TextBee!",
        "status": "SENT",
        "sentAt": "2023-09-15T14:23:45Z",
        "deliveredAt": null
      },{
        "_id": "sms_0987654321",
        "recipient": "+0987654321",
        "message": "Hello from TextBee!",
        "status": "FAILED",
        "sentAt": null,
        "deliveredAt": null,
        "failedAt": "2023-09-15T14:23:45Z",
        "errorCode": "1234567890",
        "errorMessage": "Generic error"
      }

    ]
  }
}`
      }
    }
  ]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="border rounded-lg p-4 bg-card">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">API Documentation</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Integrate SMS capabilities into your applications</p>
            <Link href="https://api.textbee.dev/" target="_blank">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                <span>Full API Docs</span>
              </Button>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              {apiEndpoints.map((endpoint) => (
                <TabsTrigger key={endpoint.id} value={endpoint.id}>
                  {endpoint.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {apiEndpoints.map((endpoint) => (
              <TabsContent key={endpoint.id} value={endpoint.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{endpoint.title}</CardTitle>
                        <CardDescription>{endpoint.description}</CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${endpoint.badge.color === 'green' 
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                            : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                          }
                        `}
                      >
                        {endpoint.badge.text} {endpoint.endpoint}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Request Examples */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium">Request</h4>
                        <div className="ml-auto">
                          <Tabs value={activeLangTab} onValueChange={setActiveLangTab}>
                            <TabsList>
                              <TabsTrigger value="node" className="flex items-center gap-1">
                                <Code className="h-3.5 w-3.5" />
                                <span>Node.js</span>
                              </TabsTrigger>
                              <TabsTrigger value="python" className="flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
                                </svg>
                                <span>Python</span>
                              </TabsTrigger>
                              <TabsTrigger value="curl" className="flex items-center gap-1">
                                <Terminal className="h-3.5 w-3.5" />
                                <span>cURL</span>
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                      </div>
                      
                      <div className="relative">
                        {Object.entries(endpoint.request).map(([lang, data], index) => {
                          const codeIndex = apiEndpoints.indexOf(endpoint) * 10 + index
                          return (
                            <div key={lang} className={lang === activeLangTab ? 'block' : 'hidden'}>
                              <div className="absolute top-2 right-2 z-10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-slate-800/20 hover:bg-slate-800/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-md"
                                  onClick={() => handleCopy(codeIndex, data.code)}
                                >
                                  {copiedIndex === codeIndex ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <SyntaxHighlighter
                                language={data.language}
                                showLineNumbers={data.language !== 'bash'}
                                style={dark}
                                customStyle={{
                                  borderRadius: '0.5rem',
                                  padding: '1.5rem',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.5',
                                  backgroundColor: '#1e293b', // slate-800
                                }}
                              >
                                {data.code}
                              </SyntaxHighlighter>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Response Example */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Response</h4>
                      <div className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-slate-800/20 hover:bg-slate-800/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-md"
                            onClick={() => handleCopy(apiEndpoints.indexOf(endpoint) * 100, endpoint.response.code)}
                          >
                            {copiedIndex === apiEndpoints.indexOf(endpoint) * 100 ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <SyntaxHighlighter
                          language={endpoint.response.language}
                          showLineNumbers={true}
                          style={dark}
                          customStyle={{
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            backgroundColor: '#1e293b', // slate-800
                          }}
                        >
                          {endpoint.response.code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6 flex justify-between">
                    <p className="text-sm text-muted-foreground">
                      For more details, see the full API documentation.
                    </p>
                    <Link href={`https://api.textbee.dev/#${endpoint.id}`} target="_blank">
                      <Button size="sm" variant="outline">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
} 