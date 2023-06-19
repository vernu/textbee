import { AddIcon, MinusIcon } from '@chakra-ui/icons'
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Container,
  Heading,
  Text,
} from '@chakra-ui/react'
import React from 'react'
import { howItWorksContent } from './howItWorksContent'

export default function HowItWorksSection() {
  return (
    <Box px={4} my={24} maxW={'6xl'}>
      {/* @ts-ignore */}
      <a name='how-it-works'>
        <Heading fontSize={'3xl'} textAlign={'center'}>
          How It Works
        </Heading>
      </a>
      <Text color={'gray.600'} fontSize={'lg'} textAlign={'center'}>
        How it works is simple. You install the app on your Android device, and
        it will turn your device into a SMS Gateway. You can then use the API to
        send SMS messages from your own applications.
      </Text>

      <Container maxW={'6xl'} mt={10} pt={0}>
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
