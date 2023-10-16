import { Box, Flex, Heading, Image, Text } from '@chakra-ui/react'
import React from 'react'
import AnimatedScrollWrapper from '../AnimatedScrollWrapper'

export default function CodeSnippetSection() {
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
            w={{ base: '100%', md: '70%' }}
          >
            <Image
              alt={'Hero Image'}
              fit={'cover'}
              align={'center'}
              // h={'100%'}
              src={
                'https://ik.imagekit.io/vernu/textbee/Screenshot%202023-09-25%20at%2011.13.30%20AM.png?updatedAt=1695629672884'
              }
              borderRadius={'lg'}
            />
          </Box>
        </Flex>
      </Box>
    </AnimatedScrollWrapper>
  )
}
