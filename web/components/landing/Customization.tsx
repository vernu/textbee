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

export default function Customization() {
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
        <GridItem colSpan={1}>
          <VStack alignItems='flex-start' spacing='20px'>
            <chakra.h2 fontSize='3xl' fontWeight='700'>
              Customization
            </chakra.h2>
            <Button
              colorScheme='blue'
              size='md'
              as={Link}
              href='https://forms.gle/WmUHvPkf4WZ69cWj9'
              target='_blank'
            >
              Contact Us
            </Button>
          </VStack>
        </GridItem>
        <GridItem colSpan={2}>
          <Flex>
            <chakra.p p={6}>
              If you need help getting this platform customized and deploy it on
              your own server, giving you more flexibility and control, reach
              out for paid customization, deployment and new feature
              development.
            </chakra.p>
          </Flex>
        </GridItem>
      </Grid>
    </Box>
  )
}
