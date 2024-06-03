import {
  Box,
  VStack,
  Button,
  Flex,
  Divider,
  chakra,
  Grid,
  GridItem,
  Container,
} from '@chakra-ui/react'
import Link from 'next/link'

export default function SupportTheProject() {
  return (
    <Box as={Container} maxW='6xl' my={14} p={4}>
      <Grid
        templateColumns={{
          base: 'repeat(1, 1fr)',
          sm: 'repeat(1, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
        gap={4}
      >
        <GridItem colSpan={2}>
          <Flex>
            <VStack alignItems='flex-start' spacing='20px'>
              <chakra.h2 fontSize='3xl' fontWeight='700'>
                Support The Project
              </chakra.h2>
              <chakra.p p={0}>
                Maintaining this open-source project requires resources and
                dedication. By becoming a patron, your contributions will
                directly support the development, enabling implementation of new
                features, enhance performance, and ensure the highest level of
                security and reliability.
              </chakra.p>
            </VStack>
          </Flex>
        </GridItem>
        <GridItem colSpan={1} justifySelf={'center'} alignSelf={'center'}>
          <Button
            colorScheme='blue'
            size='md'
            my={8}
            as={Link}
            href='https://www.patreon.com/bePatron?u=124342375'
            target='_blank'
          >
            Become a Patron
          </Button>
        </GridItem>
      </Grid>
    </Box>
  )
}
