import { Box, SimpleGrid } from '@chakra-ui/react'

import React from 'react'
import ErrorBoundary from '../ErrorBoundary'
import ApiKeyList from './ApiKeyList'
import DeviceList from './DeviceList'
import GenerateApiKey from './GenerateApiKey'

export default function APIKeyAndDevices() {
  return (
    <Box backdropBlur='2xl' borderWidth='0px' borderRadius='lg'>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 5, lg: 8 }}>
        <Box backdropBlur='2xl' borderWidth='0px' borderRadius='lg'>
          <ErrorBoundary>
            <Box maxW='xl' mx={'auto'} pt={5} px={{ base: 2, sm: 4, md: 17 }}>
              <GenerateApiKey />
              <DeviceList />
            </Box>
          </ErrorBoundary>
        </Box>
        <Box backdropBlur='2xl' borderWidth='0px' borderRadius='lg'>
          <ErrorBoundary>
            <ApiKeyList />
          </ErrorBoundary>
        </Box>
      </SimpleGrid>
    </Box>
  )
}
