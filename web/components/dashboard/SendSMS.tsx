import {
  Box,
  Button,
  FormLabel,
  Input,
  Select,
  Spinner,
  Textarea,
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
            <option
              key={device._id}
              value={device._id}
              disabled={!device.enabled}
            >
              {device.model}
            </option>
          ))}
        </Select>
      </Box>
      <Box>
        <FormLabel htmlFor='recipient'>Recipient</FormLabel>
        <Input
          placeholder='recipient'
          name='recipients'
          onChange={handleChange}
          value={formData.recipients}
          type='tel'
        />
      </Box>
      <Box>
        <FormLabel htmlFor='message'>Message</FormLabel>
        <Textarea
          id='message'
          name='message'
          onChange={handleChange}
          value={formData.message}
        />
      </Box>
    </>
  )
}

export default function SendSMS() {
  const deviceList = useSelector(selectDeviceList)
  const toast = useToast()
  const dispatch = useAppDispatch()

  const sendingSMS = useSelector(selectSendingSMS)

  const [formData, setFormData] = useState({
    device: '',
    recipients: '',
    message: '',
  })

  const handSend = (e) => {
    e.preventDefault()
    const { device: deviceId, recipients, message } = formData
    const recipientsArray = recipients.replace(' ', '').split(',')

    if (!deviceId || !recipients || !message) {
      toast({
        title: 'Please fill all fields',
        status: 'error',
      })
      return
    }

    for (let recipient of recipientsArray) {
      // TODO: validate phone numbers
    }

    dispatch(
      sendSMS({
        deviceId,
        payload: {
          recipients: recipientsArray,
          message,
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
      <Box maxW='xl' mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <SendSMSForm
          deviceList={deviceList}
          formData={formData}
          handleChange={handleChange}
        />

        <Button
          variant='outline'
          colorScheme='blue'
          onClick={handSend}
          disabled={sendingSMS}
          marginTop={3}
        >
          {sendingSMS ? <Spinner size='md' /> : 'Send'}
        </Button>
      </Box>
    </>
  )
}
