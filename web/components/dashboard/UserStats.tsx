import { Box, SimpleGrid, chakra } from '@chakra-ui/react'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectApiKeyList } from '../../store/apiKeySlice'
import { selectAuthUser } from '../../store/authSlice'
import { selectDeviceList } from '../../store/deviceSlice'
import UserStatsCard from './UserStatsCard'

const UserStats = () => {
  const authUser = useSelector(selectAuthUser)
  const deviceList = useSelector(selectDeviceList)
  const apiKeyList = useSelector(selectApiKeyList)

  return (
    <>
      <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }}>
          <chakra.h1
            textAlign={'center'}
            fontSize={'4xl'}
            py={10}
            fontWeight={'bold'}
          >
            Welcome {authUser?.name}
          </chakra.h1>
          <SimpleGrid columns={{ base: 3 }} spacing={{ base: 5, lg: 8 }}>
            <UserStatsCard
              title={'Registered '}
              stat={`${deviceList?.length || '-:-'} Devices`}
            />
            <UserStatsCard
              title={'Generated'}
              stat={`${apiKeyList?.length || '-:-'} API Keys`}
            />
            <UserStatsCard title={'Sent'} stat={'-:- SMS'} />
          </SimpleGrid>
        </SimpleGrid>
      </Box>
    </>
  )
}

export default UserStats
