import { Box, SimpleGrid, chakra } from '@chakra-ui/react'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAuthUser } from '../../store/authSlice'
import UserStatsCard from './UserStatsCard'
import {
  fetchStats,
  selectStatsData,
  selectStatsLoading,
} from '../../store/statsSlice'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

const UserStats = () => {
  const authUser = useSelector(selectAuthUser)

  const { totalApiKeyCount, totalDeviceCount, totalSMSCount } =
    useAppSelector(selectStatsData)
  const statsLoading = useAppSelector(selectStatsLoading)

  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch])

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
              stat={`${statsLoading ? '-:-' : totalDeviceCount} Devices`}
            />
            <UserStatsCard
              title={'Generated'}
              stat={`${statsLoading ? '-:-' : totalApiKeyCount} API Keys`}
            />
            <UserStatsCard
              title={'Sent'}
              stat={`${statsLoading ? '-:-' : totalSMSCount} SMS Sent`}
            />
          </SimpleGrid>
        </SimpleGrid>
      </Box>
    </>
  )
}

export default UserStats
