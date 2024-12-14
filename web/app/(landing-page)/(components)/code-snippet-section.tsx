'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const codeSnippets = [
  {
    tech: 'NodeJs',
    language: 'javascript',
    snippet: `import axios from 'axios'

const BASE_URL = 'https://api.textbee.dev/api/v1'
const API_KEY = 'YOUR_API_KEY'
const DEVICE_ID = 'YOUR_DEVICE_ID'

const response = await axios.post(\`\$\{BASE_URL\}/gateway/devices/\$\{DEVICE_ID}/send-sms\`, {
  recipients: [ '+1234567890' ],
  message: 'Hello World!',
}, {
  headers: {
    'x-api-key': API_KEY,
  },
})

console.log(response.data)`,
  },
  {
    tech: 'Python',
    language: 'python',
    snippet: `import requests

BASE_URL = 'https://api.textbee.dev/api/v1'
API_KEY = 'YOUR_API_KEY'
DEVICE_ID = 'YOUR_DEVICE_ID'

response = requests.post(
f'{BASE_URL}/api/device/{DEVICE_ID}/send-sms',
json={
    'recipients': ['+1234567890'],
    'message': 'Hello World!'
},
headers={'x-api-key': API_KEY})

print(response.json())`,
  },
  {
    tech: 'cURL',
    language: 'bash',
    snippet: `curl -X POST "https://api.textbee.dev/api/v1/gateway/devices/YOUR_DEVICE_ID/send-sms" \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "recipients": [ "+1234567890" ],
    "message": "Hello from textbee.dev"
  }'`,
  },
]

export default function CodeSnippetSection() {
  return (
    <section className='container mx-auto py-24 px-4 sm:px-6 lg:px-8 max-w-7xl bg-gray-50 dark:bg-muted rounded-2xl my-12'>
      <div className='mx-auto max-w-[58rem]'>
        <h3 className='text-3xl font-bold mb-8'>Code Snippet</h3>
        <div className='bg-white dark:bg-black p-6 rounded-xl shadow-sm'>
          <Tabs defaultValue={codeSnippets[0].tech} className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              {codeSnippets.map((snippet) => {
                return (
                  <TabsTrigger key={snippet.tech} value={snippet.tech}>
                    {snippet.tech}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {codeSnippets.map((snippet) => {
              return (
                <TabsContent key={snippet.tech} value={snippet.tech}>
                  <SyntaxHighlighter
                    language={snippet.language}
                    showLineNumbers={snippet.language !== 'bash'}
                    style={dark}
                    // className='min-h-[200px]'
                  >
                    {snippet.snippet}
                  </SyntaxHighlighter>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      </div>
    </section>
  )
}
