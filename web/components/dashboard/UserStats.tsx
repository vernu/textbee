import { Box, Grid, GridItem, SimpleGrid, chakra } from '@chakra-ui/react'
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

  const {
    totalApiKeyCount,
    totalDeviceCount,
    totalReceivedSMSCount,
    totalSentSMSCount,
  } = useAppSelector(selectStatsData)
  const statsLoading = useAppSelector(selectStatsLoading)

  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch])

  return (
    <>
      <Box maxW='12xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <Grid
          templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }}
          gap={6}
        >
          <GridItem colSpan={1}>
            <chakra.h1
              textAlign={'center'}
              fontSize={'2xl'}
              py={10}
              fontWeight={'bold'}
            >
              Welcome {authUser?.name}
            </chakra.h1>
          </GridItem>
          <GridItem colSpan={2}>
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              spacing={{ base: 5, lg: 8 }}
            >
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
                stat={`${statsLoading ? '-:-' : totalSentSMSCount} SMS Sent`}
              />
              <UserStatsCard
                title={'Received'}
                stat={`${
                  statsLoading ? '-:-' : totalReceivedSMSCount
                } SMS Received`}
              />
            </SimpleGrid>
          </GridItem>
        </Grid>
      </Box>
    </>
  )
}

export default UserStats
