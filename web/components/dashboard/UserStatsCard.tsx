import {
  Stat,
  StatLabel,
  StatNumber,
  useColorModeValue,
} from '@chakra-ui/react'
import React from 'react'

export default function UserStatsCard({ ...props }) {
  const { title, stat } = props
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'3'}
      shadow={'xl'}
      border={'1px solid'}
      borderColor={useColorModeValue('gray.300', 'gray.700')}
      rounded={'lg'}
      style={{
        height: '90px',
      }}
      alignContent={'center'}
    >
      <StatLabel fontWeight={'medium'} isTruncated>
        {title}
      </StatLabel>
      <StatNumber fontSize={'md'} fontWeight={'medium'}>
        {stat}
      </StatNumber>
    </Stat>
  )
}
