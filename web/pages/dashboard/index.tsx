import { Box, SimpleGrid } from '@chakra-ui/react'

import ApiKeyList from '../../components/dashboard/ApiKeyList'
import UserStats from '../../components/dashboard/UserStats'
import GenerateApiKey from '../../components/dashboard/GenerateApiKey'

export default function Dashboard() {
  return (
    <>
      <UserStats />
      <Box maxW='7xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 5, lg: 8 }}>
          <div>
            <GenerateApiKey />
            <ApiKeyList />
          </div>
        </SimpleGrid>
      </Box>
    </>
  )
}
