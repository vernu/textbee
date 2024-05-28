import {
  Box,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import React from 'react'
import AnimatedScrollWrapper from '../AnimatedScrollWrapper'
import SyntaxHighlighter from 'react-syntax-highlighter'

export default function CodeSnippetSection() {
  const codeSnippets = [
    {
      tech: 'Node.Js',
      language: 'javascript',
      snippet: `
    const BASE_URL = 'https://api.textbee.dev/api/v1'
    const API_KEY = 'YOUR_API_KEY'
    const DEVICE_ID = 'YOUR_DEVICE_ID'
    
    await axios.post(\`\$\{BASE_URL\}/gateway/devices/\$\{DEVICE_ID}/sendSMS\`, {
      recipients: [ '+251912345678' ],
      message: 'Hello World!',
    }, {
      headers: {
        'x-api-key': API_KEY,
      },
    })
    `,
    },
    {
      tech: 'cURL',
      language: 'shell',
      snippet: `curl -X POST \ https://api.textbee.dev/api/v1/gateway/devices/<DEVICE_ID>/sendSMS \ -H 'x-api-key: <API_KEY>' \ -H 'Content-Type: application/json' \ -d '{ "recipients": ["+251912345678"], "message": "Hello World!" }'`,
    },
  ]

  return (
    <AnimatedScrollWrapper>
      <Box m={{ base: 0, md: 8 }} p={{ base: 0, md: 8 }}>
        <Flex
          height='100%'
          direction='column'
          justifyContent='center'
          alignItems='center'
        >
          <Heading fontSize={'3xl'} textAlign={'center'} py={8}>
            Code Snippet
          </Heading>
          <Text color={'gray.600'} fontSize={'lg'} textAlign={'center'} pb='4'>
            Send SMS messages from your web application using our REST API. You
            can use any programming language to interact with our API. Here is a
            sample code snippet in JavaScript using axios library.
          </Text>

          <Box
            borderRadius={'lg'}
            padding={{ base: 0, md: 8 }}
            border={'1px solid #E2E8F0'}
            w={{ base: '100%', md: '90%' }}
          >
            <Tabs>
              <TabList>
                {codeSnippets.map((snippet) => (
                  <Tab key={snippet.tech}>{snippet.tech}</Tab>
                ))}
              </TabList>
              <TabPanels>
                {codeSnippets.map((snippet) => {
                  return (
                    <TabPanel key={snippet.tech}>
                      <SyntaxHighlighter language={snippet.language}>
                        {snippet.snippet}
                      </SyntaxHighlighter>
                    </TabPanel>
                  )
                })}
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Box>
    </AnimatedScrollWrapper>
  )
}
