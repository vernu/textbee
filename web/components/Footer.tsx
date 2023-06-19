import {
  Box,
  chakra,
  Container,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import Link from 'next/link'

export default function Footer() {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
    >
      <Container
        as={Stack}
        maxW={'6xl'}
        py={4}
        spacing={4}
        justify={'center'}
        align={'center'}
      >
        <Stack direction={'row'} spacing={6}>
          <Link href='/'>Home</Link>
          <Link href='/dashboard'>Dashboard</Link>
          <Link href='/android'>Download App</Link>
          <Link href='https://github.com/vernu/textbee'>Github</Link>
        </Stack>
      </Container>

      <Box
        borderTopWidth={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Container
          as={Stack}
          maxW={'6xl'}
          py={4}
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify='center'
          align={{ base: 'center', md: 'center' }}
        >
          <Text>© {new Date().getFullYear()} All rights reserved</Text>
        </Container>
      </Box>
    </Box>
  )
}
