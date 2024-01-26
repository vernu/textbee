import {
  Box,
  Button,
  Flex,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectDeviceList,
  selectSendingSMS,
  sendSMS,
} from '../../store/deviceSlice'
import { useAppDispatch } from '../../store/hooks'

export const SendSMSForm = ({ deviceList, formData, handleChange }) => {
  return (
    <>
      <Box>
        <FormLabel htmlFor='device'>Select Device</FormLabel>
        <Select
          id='device'
          name='device'
          placeholder='Select Device'
          onChange={handleChange}
          value={formData.device}
        >
          {deviceList.map((device) => (
            <option key={device._id} value={device._id}>
              {device.model}
            </option>
          ))}
        </Select>
      </Box>
      <Box>
        <FormLabel htmlFor='receivers'>Receiver</FormLabel>
        <Input
          placeholder='receiver'
          name='receivers'
          onChange={handleChange}
          value={formData.receivers}
          type='tel'
        />
      </Box>
      <Box>
        <FormLabel htmlFor='smsBody'>SMS Body</FormLabel>
        <Textarea
          id='smsBody'
          name='smsBody'
          onChange={handleChange}
          value={formData.smsBody}
        />
      </Box>
    </>
  )
}

export default function SendSMS() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const deviceList = useSelector(selectDeviceList)
  const toast = useToast()
  const dispatch = useAppDispatch()

  const sendingSMS = useSelector(selectSendingSMS)

  const [formData, setFormData] = useState({
    device: '',
    receivers: '',
    smsBody: '',
  })

  const handSend = (e) => {
    e.preventDefault()
    const { device: deviceId, receivers, smsBody } = formData
    const receiversArray = receivers.replace(' ', '').split(',')

    if (!deviceId || !receivers || !smsBody) {
      toast({
        title: 'Please fill all fields',
        status: 'error',
      })
      return
    }

    for (let receiver of receiversArray) {
      // TODO: validate phone numbers
    }

    
    dispatch(
      sendSMS({
        deviceId,
        payload: {
          receivers: receiversArray,
          smsBody,
        },
      })
    )
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <Flex justifyContent='flex-end' marginBottom={20}>
        <Button bg={'blue.400'} color={'white'} onClick={onOpen}>
          Send SMS
        </Button>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send SMS</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SendSMSForm
              deviceList={deviceList}
              formData={formData}
              handleChange={handleChange}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
              variant='outline'
              colorScheme='blue'
              onClick={handSend}
              disabled={sendingSMS}
            >
              {sendingSMS ? <Spinner size='md' /> : 'Send'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
