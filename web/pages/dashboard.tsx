import {
  Box,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
} from '@chakra-ui/react'
import ApiKeyList from '../components/dashboard/ApiKeyList'
import UserStats from '../components/dashboard/UserStats'
import GenerateApiKey from '../components/dashboard/GenerateApiKey'
import DeviceList from '../components/dashboard/DeviceList'
import { useSelector } from 'react-redux'
import { selectAuthUser } from '../store/authSlice'
import Router from 'next/router'
import { useEffect, useState } from 'react'
import SendSMS from '../components/dashboard/SendSMS'
import ErrorBoundary from '../components/ErrorBoundary'
import dynamic from 'next/dynamic'

export default function Dashboard() {
  const NoSSRAnimatedWrapper = dynamic(
    () => import('../components/AnimatedScrollWrapper'),
    {
      ssr: false,
    }
  )

  const authUser = useSelector(selectAuthUser)
  const toast = useToast()
  useEffect(() => {
    if (!authUser) {
      toast({
        title: 'You are not logged in',
        description: 'Please login to access this page',
        status: 'warning',
      })
      Router.push('/login')
    }
  }, [authUser, toast])

  return (
    <>
      <NoSSRAnimatedWrapper>
        <UserStats />
        <DashboardTabView />
      </NoSSRAnimatedWrapper>
    </>
  )
}

const DashboardTabView = () => {
  const [tabIndex, setTabIndex] = useState(1)
  return (
    <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Tabs isLazy={false} index={tabIndex} onChange={setTabIndex}>
        <TabList>
          {/* <Tab>Get Started</Tab> */}
          <Tab>API Key and Devices</Tab>
          <Tab>Send SMS</Tab>
          <Tab>Receive SMS</Tab>
        </TabList>
        <TabPanels>
          {/* <TabPanel>
      Get Started
    </TabPanel> */}
          <TabPanel>
            <APIKeyAndDevices />
          </TabPanel>
          <TabPanel>
            <SendSMS />
          </TabPanel>
          <TabPanel>Receive SMS</TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

const APIKeyAndDevices = () => {
  return (
    <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <Box maxW='xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <GenerateApiKey />
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 5, lg: 8 }}>
        <Box backdropBlur='2xl' borderWidth='0px' borderRadius='lg'>
          <ErrorBoundary>
            <ApiKeyList />
          </ErrorBoundary>
        </Box>
        <Box backdropBlur='2xl' borderWidth='0px' borderRadius='lg'>
          {/* <SendSMS /> */}
          <ErrorBoundary>
            <DeviceList />
          </ErrorBoundary>
        </Box>
      </SimpleGrid>
    </Box>
  )
}
