import { Box, SimpleGrid, chakra } from '@chakra-ui/react'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectApiKeyList } from '../../store/apiKeyListReducer'
import { selectAuth } from '../../store/authReducer'
import { selectDeviceList } from '../../store/deviceListReducer'
import UserStatsCard from './UserStatsCard'

const UserStats = () => {
  const { user: currentUser } = useSelector(selectAuth)

  const { data: deviceListData } = useSelector(selectDeviceList)
  const { data: apiKeyListData } = useSelector(selectApiKeyList)
  
  return (
    <>
      <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} >
          <chakra.h1
            textAlign={'center'}
            fontSize={'4xl'}
            py={10}
            fontWeight={'bold'}
          >
            Welcome {currentUser?.name}
          </chakra.h1>
          <SimpleGrid columns={{ base: 3 }} spacing={{ base: 5, lg: 8 }}>
            <UserStatsCard title={'Registered '} stat={`${deviceListData?.length || '-:-'} Devices`} />
            <UserStatsCard title={'Generated'} stat={`${apiKeyListData?.length || '-:-'} API Keys`} />
            <UserStatsCard title={'Sent'} stat={'-:- SMS'} />
          </SimpleGrid>
        </SimpleGrid>
      </Box>
    </>
  )
}

export default UserStats
