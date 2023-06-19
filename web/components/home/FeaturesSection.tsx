import { CheckIcon } from '@chakra-ui/icons'
import {
  Box,
  Container,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import React from 'react'
import { featuresContent } from './featuresContent'

export default function FeaturesSection() {
  const boxBgColor = useColorModeValue('gray.100', 'gray.800')

  return (
    <Box p={4} my={16} maxW={'6xl'}>
      <Heading fontSize={'3xl'} textAlign={'center'} pb={0}>
        Features
      </Heading>
      <Text color={'gray.600'} fontSize={'lg'} textAlign={'center'}>
        The ultimate solution for your messaging needs! Our free open-source
        Android-based SMS Gateway provides you with all the features you need to
        effectively manage your SMS communications. From sending messages and
        automating messaging workflows via API, our SMS Gateway is the perfect
        tool for any small/mid business or individual.
      </Text>

      <Container maxW={'6xl'} mt={0}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3} pt={16}>
          {featuresContent.map((feature, i) => (
            <HStack
              key={i}
              align={'top'}
              borderWidth='1px'
              borderRadius='sm'
              p={2}
              shadow='lg'
              background={boxBgColor}
            >
              <Box color={'green.400'} px={1}>
                <Icon as={CheckIcon} />
              </Box>
              <VStack align={'start'}>
                <Text fontWeight={800}>{feature.title}</Text>
                <Text fontWeight='normal'>{feature.description}</Text>
              </VStack>
            </HStack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}
