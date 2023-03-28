import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Container,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react'
import React from 'react'
import { howItWorksContent } from './howItWorksContent'

export default function HowItWorksSection() {
  return (
    <Box p={4}>
      <Stack spacing={4} as={Container} maxW={'6xl'}>
        <a id='#how-it-works'>
          <Heading fontSize={'3xl'} textAlign={'center'} pt={16}>
            How It Works
          </Heading>
        </a>
        <Text color={'gray.600'} fontSize={'lg'} textAlign={'justify'}>
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Illo
          exercitationem quo quibusdam, fugit quaerat odio quisquam commodi ut?
          Aliquid ab sapiente, expedita quas neque amet consectetur quisquam
          reprehenderit voluptas commodi?
        </Text>
      </Stack>

      <Container maxW={'6xl'} mt={10} pt={8}>
        <Accordion allowMultiple defaultIndex={[]}>
          {howItWorksContent.map(({ title, description }) => (
            <AccordionItem key={title}>
              {({ isExpanded }) => (
                <>
                  <h2>
                    <AccordionButton>
                      <Box as='span' flex='1' textAlign='left'>
                        {title}
                      </Box>
                      {isExpanded ? (
                        <MinusIcon fontSize='12px' />
                      ) : (
                        <AddIcon fontSize='12px' />
                      )}
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>{description}</AccordionPanel>
                </>
              )}
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Box>
  )
}
