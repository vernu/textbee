import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
} from '@chakra-ui/react'
import UserStats from '../components/dashboard/UserStats'
import { useSelector } from 'react-redux'
import { selectAuthUser } from '../store/authSlice'
import Router from 'next/router'
import { useEffect, useState } from 'react'
import SendSMS from '../components/dashboard/SendSMS'
import dynamic from 'next/dynamic'
import ReceiveSMS from '../components/dashboard/ReceiveSMS'
import APIKeyAndDevices from '../components/dashboard/APIKeyAndDevices'

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
  const [tabIndex, setTabIndex] = useState(0)
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
          {/* <TabPanel>Get Started</TabPanel> */}
          <TabPanel>
            <APIKeyAndDevices />
          </TabPanel>
          <TabPanel>
            <SendSMS />
          </TabPanel>
          <TabPanel>
            <ReceiveSMS />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
