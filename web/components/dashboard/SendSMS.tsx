import {
  Box,
  Button,
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
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { sendSMSRequest } from '../../services'
import { selectDeviceList } from '../../store/deviceListReducer'

export default function SendSMS() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const deviceList = useSelector(selectDeviceList)
  const toast = useToast()

  const [formData, setFormData] = useState({
    device: '',
    receivers: '',
    smsBody: '',
  })

  const handSend = (e) => {
    e.preventDefault()
    sendSMSRequest(formData.device, {
      receivers: formData.receivers.replace(' ', '').split(','),
      smsBody: formData.smsBody,
    })

    toast({
      title: 'Sending SMS...',
    })
    onClose()
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <Button onClick={onOpen}>Start Sending</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send SMS</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
              <FormLabel htmlFor='device'>Select Device</FormLabel>
              <Select
                id='device'
                name='device'
                placeholder='Select Device'
                onChange={handleChange}
                value={formData.smsBody}
              >
                {deviceList.data.map((device) => (
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
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant='outline' colorScheme='blue' onClick={handSend}>
              Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
