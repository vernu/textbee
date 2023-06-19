import { Box, Flex, Heading, Image, Text } from '@chakra-ui/react'
import React from 'react'

export default function CodeSnippetSection() {
  return (
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
          w={{ base: '100%', md: '70%' }}
        >
          <Image
            alt={'Hero Image'}
            fit={'cover'}
            align={'center'}
            // h={'100%'}
            src={
              'https://ik.imagekit.io/vernu/textbee/Screenshot_2023-06-18_at_11.30.25_AM.png?updatedAt=1687077054749'
            }
            borderRadius={'lg'}
          />
        </Box>
      </Flex>
    </Box>
  )
}
