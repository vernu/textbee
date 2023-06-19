import {
  Box,
  Button,
  chakra,
  Flex,
  Image,
  useColorModeValue,
} from '@chakra-ui/react'
import React from 'react'

export default function DownloadAppSection() {
  return (
    <Box my={16}>
      <Flex
        padding={5}
        background={useColorModeValue('gray.100', 'gray.700')}
        borderRadius='2xl'
      >
        <Flex
          borderRadius='2xl'
          m={{ base: 5, md: 8 }}
          p={{ base: 5, md: 8 }}
          width='100%'
          border='1px solid gray'
          direction='row'
          justifyContent='center'
        >
          <Box>
            <Image
              alt={'Hero Image'}
              fit={'cover'}
              align={'center'}
              w={'180px'}
              // h={'100%'}
              src={'/images/smsgatewayandroid.png'}
            />
          </Box>
          <Box>
            <Flex
              height='100%'
              direction='column'
              justifyContent='center'
              alignItems='center'
            >
              <chakra.h1
                fontSize='md'
                fontWeight='bold'
                my={4}
                color={useColorModeValue('gray.800', 'white')}
              >
                Download the App to get started!
              </chakra.h1>
              <chakra.p
                fontSize='sm'
                color={useColorModeValue('gray.600', 'gray.400')}
                mb={4}
              >
                Unlock the power of messaging with our open-source Android SMS
                Gateway.
              </chakra.p>
              <a href='/android' target='_blank'>
                <Button
                  /* flex={1} */
                  px={4}
                  fontSize={'sm'}
                  rounded={'full'}
                  bg={'blue.400'}
                  color={'white'}
                  boxShadow={
                    '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
                  }
                  _hover={{
                    bg: 'blue.500',
                  }}
                  _focus={{
                    bg: 'blue.500',
                  }}
                >
                  Download App
                </Button>
              </a>
            </Flex>
          </Box>
        </Flex>
      </Flex>
    </Box>
  )
}
