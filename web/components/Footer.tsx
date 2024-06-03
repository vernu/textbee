import {
  Box,
  chakra,
  Container,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

export default function Footer() {
  const NoSSRAnimatedWrapper = dynamic(
    () => import('../components/AnimatedScrollWrapper'),
    {
      ssr: false,
    }
  )

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
          <NoSSRAnimatedWrapper>
            <a
              href='https://www.patreon.com/bePatron?u=124342375'
              data-patreon-widget-type='become-patron-button'
            >
              Become a Patron!
            </a>
            <script
              async
              src='https://c6.patreon.com/becomePatronButton.bundle.js'
            ></script>
          </NoSSRAnimatedWrapper>
          <Link href='https://dl.textbee.dev' target='_blank'>
            {' '}
            Download App
          </Link>
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
