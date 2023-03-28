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
  VStack,
} from '@chakra-ui/react'
import React from 'react'
import { featuresContent } from './featuresContent'

const FeaturesSection = () => {
  return (
    <Box p={4}>
      <Stack spacing={4} as={Container} maxW={'6xl'}>
        <Heading fontSize={'3xl'} textAlign={'center'} pt={16}>
          Features
        </Heading>
        <Text color={'gray.600'} fontSize={'lg'} textAlign={'justify'}>
          The ultimate solution for your messaging needs! Our free open-source
          Android-based SMS Gateway provides you with all the features you need
          to effectively manage your SMS communications. From sending messages
          and automating messaging workflows via API, our SMS Gateway is the
          perfect tool for any small/mid business or individual.
        </Text>
      </Stack>

      <Container maxW={'6xl'} mt={10}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10} pt={16}>
          {featuresContent.map((feature, i) => (
            <HStack key={i} align={'top'} borderWidth="1px" borderRadius="lg" p={2} shadow='lg' >
              <Box color={'green.400'} px={2}>
                <Icon as={CheckIcon} />
              </Box>
              <VStack align={'start'}>
                <Text fontWeight={600}>{feature.title}</Text>
                <Text color={'gray.600'}>{feature.description}</Text>
              </VStack>
            </HStack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  )
}

export default FeaturesSection
