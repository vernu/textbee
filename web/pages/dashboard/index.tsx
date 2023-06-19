import { Box, Flex, SimpleGrid, useToast } from '@chakra-ui/react'

import ApiKeyList from '../../components/dashboard/ApiKeyList'
import UserStats from '../../components/dashboard/UserStats'
import GenerateApiKey from '../../components/dashboard/GenerateApiKey'
import DeviceList from '../../components/dashboard/DeviceList'
import { useSelector } from 'react-redux'
import { selectAuth } from '../../store/authReducer'
import Router from 'next/router'
import { useEffect } from 'react'
import SendSMS from '../../components/dashboard/SendSMS'
import ErrorBoundary from '../../components/ErrorBoundary'

export default function Dashboard() {
  const { user: currentUser } = useSelector(selectAuth)
  const toast = useToast()
  useEffect(() => {
    if (!currentUser) {
      toast({
        title: 'You are not logged in',
        description: 'Please login to access this page',
        status: 'warning',
      })
      Router.push('/login')
    }
  }, [currentUser, toast])
  return (
    <>
      <UserStats />
      <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <Flex justifyContent='space-eve nly'></Flex>

        <br />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 5, lg: 8 }}>
          <Box backdropBlur='2xl' borderWidth='0px' borderRadius='lg'>
            <GenerateApiKey />
            <ErrorBoundary>
              <ApiKeyList />
            </ErrorBoundary>
          </Box>
          <Box backdropBlur='2xl' borderWidth='0px' borderRadius='lg'>
            <SendSMS />
            <ErrorBoundary>
              <DeviceList />
            </ErrorBoundary>
          </Box>
        </SimpleGrid>
      </Box>
    </>
  )
}
