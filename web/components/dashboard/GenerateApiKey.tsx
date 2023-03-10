import {
  Button,
  chakra,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'

import QRCode from 'react-qr-code'
import { generateApiKeyRequest } from '../../services'

const NewApiKeyGeneratedModal = ({
  isOpen = false,
  generatedApiKey,
  onClose,
  showQR = false,
  ...props
}) => {
  const toast = useToast()
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Api Key Generated</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {showQR && (
            <>
              <chakra.h1
                fontSize='md'
                fontWeight='bold'
                mt={2}
                // color={useColorModeValue('gray.800', 'white')}
              >
                Open the SMS Gateway App and scan this QR to get started
              </chakra.h1>

              <Flex justifyContent='center'>
                <QRCode value={generatedApiKey} />{' '}
              </Flex>
            </>
          )}
          <chakra.h1
            fontSize='lg'
            fontWeight='bold'
            mt={2}
            // color={useColorModeValue('gray.800', 'white')}
          >
            {generatedApiKey}
          </chakra.h1>
          <chakra.h1
            fontSize='lg'
            fontWeight='bold'
            mt={2}
            color={useColorModeValue('red.800', 'white')}
          >
            {'Save this key, it wont be shown again ;)'}
          </chakra.h1>
        </ModalBody>

        <ModalFooter>
          <Button
            variant='ghost'
            onClick={() => {
              navigator.clipboard.writeText(generatedApiKey)
              toast({
                title: 'Copied to clipboard',
                status: 'success',
              })
            }}
          >
            Copy to Clipboard
          </Button>{' '}
          <Button
            colorScheme='blue'
            mr={3}
            onClick={() => {
              onClose()
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default function GenerateApiKey() {
  const [generatedApiKey, setGeneratedApiKey] = useState(null)
  const [generatingApiKey, setGeneratingApiKey] = useState(null)
  const [showGeneratedApiKeyModal, setShowGeneratedApiKeyModal] =
    useState(false)

  const generateApiKey = async () => {
    setGeneratingApiKey(true)
    const newApiKey = await generateApiKeyRequest()
    setGeneratedApiKey(newApiKey)
    setShowGeneratedApiKeyModal(true)
    setGeneratingApiKey(false)
  }
  return (
    <>
      {' '}
      <Flex justifyContent='center'>
        <Button
          /* flex={1} */
          px={4}
          fontSize={'sm'}
          rounded={'full'}
          bg={'blue.400'}
          color={'white'}
          boxShadow={
            '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
          }
          _hover={{
            bg: 'blue.500',
          }}
          _focus={{
            bg: 'blue.500',
          }}
          onClick={generateApiKey}
          disabled={generatingApiKey}
        >
          {generatingApiKey
            ? 'generating... '
            : 'Generate Api Key/ Register Device'}
        </Button>
      </Flex>
      {generatedApiKey && (
        <>
          {
            <NewApiKeyGeneratedModal
              isOpen={showGeneratedApiKeyModal}
              generatedApiKey={generatedApiKey}
              showQR={true}
              onClose={() => {
                setShowGeneratedApiKeyModal(false)
              }}
            />
          }
        </>
      )}
    </>
  )
}
