import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'

import Link from 'next/link'
import { useState } from 'react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { authService } from '../services/authService'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(false)
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [resetSuccess, setResetSuccess] = useState<boolean>(false)

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
  })

  const toast = useToast()

  const handleRequestResetPassword = async (e) => {
    setLoading(true)

    authService
      .requestPasswordReset(formData)
      .then((res) => {
        setOtpSent(true)
        toast({
          title: 'OTP sent successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.response.data.message || 'Something went wrong',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleResetPassword = async (e) => {
    setLoading(true)

    authService
      .resetPassword(formData)
      .then((res) => {
        toast({
          title: 'Password reset successfully',
          status: 'success',
        })
        setResetSuccess(true)
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Something went wrong',
          status: 'error',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }
  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const colorModeValue = useColorModeValue('gray.50', 'gray.800')

  if (resetSuccess) {
    return (
      <>
        <Flex
          minH={'90vh'}
          align={'center'}
          justify={'center'}
          bg={colorModeValue}
        >
          <Stack pt={6}>
            <Text align={'center'}>Password reset successfully</Text>
            <Link href='/login'>
              <Button variant={'ghost'}>Go back to login page</Button>
            </Link>
          </Stack>
        </Flex>
      </>
    )
  }

  return (
    <Flex
      minH={'90vh'}
      align={'center'}
      justify={'center'}
      bg={colorModeValue}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'2xl'} textAlign={'center'}>
            Reset Password
          </Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={colorModeValue}
          boxShadow={'lg'}
          p={8}
        >
          <Stack spacing={4}>
            <FormControl id='email' isRequired>
              <FormLabel>Email address</FormLabel>
              <Input type='email' name='email' onChange={onChange} />
            </FormControl>
            {otpSent && (
              <>
                <FormControl id='otp' isRequired>
                  <FormLabel>OTP</FormLabel>
                  <Input type='number' name='otp' onChange={onChange} />
                </FormControl>
                <FormControl id='newPassword' isRequired>
                  <FormLabel>New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name='newPassword'
                      onChange={onChange}
                    />
                    <InputRightElement h={'full'}>
                      <Button
                        variant={'ghost'}
                        onClick={() =>
                          setShowPassword((showPassword) => !showPassword)
                        }
                      >
                        {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </>
            )}
            <Stack spacing={10} pt={2}>
              <Button
                loadingText='Submitting'
                size='lg'
                bg={'blue.400'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                onClick={
                  otpSent ? handleResetPassword : handleRequestResetPassword
                }
                disabled={loading}
              >
                {loading ? 'Please Wait...' : 'Continue'}
              </Button>
            </Stack>

            <Stack pt={6}>
              <Text align={'center'}>
                <Link href='/login'>Go back to login</Link>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}
