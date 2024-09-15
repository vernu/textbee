import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Grid,
  GridItem,
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
import { InfoIcon } from '@chakra-ui/icons'

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
  const ctaOptions = [
    {
      title: 'Get instant support from other developers.',
      actionButton: 'Join our Discord Server',
      link: 'https://discord.gg/d7vyfBpWbQ',
    },
    {
      title: 'Have questions? Get answers from our community.',
      actionButton: 'Join Now on Discord',
      link: 'https://discord.gg/d7vyfBpWbQ',
    },
    {
      title: 'Stay updated with the latest features and announcements.',
      actionButton: 'Join our Community',
      link: 'https://discord.gg/d7vyfBpWbQ',
    },
    {
      title: 'Have Questions? Our Discord Community Has Answers!',
      actionButton: 'Join our Community',
      link: 'https://discord.gg/d7vyfBpWbQ',
    },
    {
      title: 'Stay Updated with the Latest Features',
      actionButton: 'Join our Discord Community',
      link: 'https://discord.gg/d7vyfBpWbQ',
    },
    {
      title: 'Don’t Miss Out on Updates',
      actionButton: 'Join our Discord Community',
      link: 'https://discord.gg/d7vyfBpWbQ',
    },

    {
      title: 'Help us keep the project alive and growing.',
      actionButton: 'Support Us on Patreon',
      link: 'https://patreon.com/vernu',
    },
    {
      title: 'Your contribution makes a difference.',
      actionButton: 'Become a Patron',
      link: 'https://patreon.com/vernu',
    },
    {
      title: 'Enjoying the platform? Consider supporting us.',
      actionButton: 'Donate on Patreon',
      link: 'https://patreon.com/vernu',
    },
    {
      title: 'Your support helps us maintain and expand the project.',
      actionButton: 'Support on Patreon',
      link: 'https://patreon.com/vernu',
    },
    {
      title: 'Love what we’re doing? Show your support.',
      actionButton: 'Become a Supporter',
      link: 'https://patreon.com/vernu',
    },
    {
      title: 'Help us keep this project free and open.',
      actionButton: 'Become a Patreon',
      link: 'https://patreon.com/vernu',
    },

    {
      title: 'Enjoying our project? Show your support.',
      actionButton: 'Star Us on GitHub',
      link: 'https://github/vernu/textbee',
    },
    {
      title: 'Support us by starring on GitHub.',
      actionButton: 'Give us a star',
      link: 'https://github/vernu/textbee',
    },
    {
      title: 'Help us grow on GitHub.',
      actionButton: 'Give a star',
      link: 'https://github/vernu/textbee',
    },
  ]

  const randomIndex = Math.floor(Math.random() * ctaOptions.length)

  const {
    title: ctaTitle,
    actionButton: ctaAction,
    link: ctaLink,
  } = ctaOptions[randomIndex]
  return (
    <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      {/* <Alert status='error'>
        <AlertIcon />
        Urgent Notice: Due to recent changes to Google&apos;s FCM platform, your
        token may be out of sync with textbee server and text messages may not
        be delivered properly. To resolve this issue, please open the textbee
        mobile app and click the Update button found right below the api key
        input. and this will update your token.
      </Alert> */}
      <Alert status='info'>
        <Grid
          templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
          gap={3}
        >
          <GridItem colSpan={1} p={2}>
            <InfoIcon mx={3} /> {ctaTitle}{' '}
          </GridItem>
          <GridItem colSpan={1}>
            <a href={ctaLink} target='_blank'>
              <Button
                mx={3}
                display={{
                  xs: 'block',
                  md: 'inline-flex',
                }}
              >
                {ctaAction}
              </Button>
            </a>
          </GridItem>
        </Grid>
      </Alert>
      <Tabs isLazy={false} index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>API Key and Devices</Tab>
          <Tab>Send SMS</Tab>
          <Tab>Receive SMS</Tab>
        </TabList>
        <TabPanels>
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
