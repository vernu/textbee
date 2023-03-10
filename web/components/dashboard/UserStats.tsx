import { Box, SimpleGrid, chakra } from '@chakra-ui/react'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '../../store/authSlice'
import UserStatsCard from './UserStatsCard'

const UserStats = () => {
  const { user: currentUser } = useSelector(selectAuth)
  return (
    <>
      <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <chakra.h1
          textAlign={'center'}
          fontSize={'4xl'}
          py={10}
          fontWeight={'bold'}
        >
          Welcome {currentUser?.name}
        </chakra.h1>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
          <UserStatsCard title={'Registered '} stat={'2 devices'} />
          <UserStatsCard title={'Generated'} stat={'3 API Keys'} />
          <UserStatsCard title={'Sent'} stat={'100 SMS'} />
        </SimpleGrid>
      </Box>
    </>
  )
}

export default UserStats
