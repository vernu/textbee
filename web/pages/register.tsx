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
import {
  loginWithGoogle,
  register,
  selectAuthUser,
  selectAuthLoading,
} from '../store/authSlice'
import { useDispatch, useSelector } from 'react-redux'
import { RegisterRequestPayload } from '../services/types'
import { GoogleLogin } from '@react-oauth/google'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState<RegisterRequestPayload>({
    name: '',
    email: '',
    password: '',
  })
  const toast = useToast()
  const dispatch = useDispatch()
  const authUser = useSelector(selectAuthUser)
  const loading = useSelector(selectAuthLoading)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!credentials.name || !credentials.email || !credentials.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'warning',
      })
    } else {
      dispatch(register(credentials))
    }
  }
  const onChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Flex
      minH={'90vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'2xl'} textAlign={'center'}>
            Register now and start using your android device as an SMS Gateway
          </Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <Stack spacing={4}>
            <FormControl id='name' isRequired>
              <FormLabel>Name</FormLabel>
              <Input type='text' name='name' onChange={onChange} />
            </FormControl>
            <FormControl id='email' isRequired>
              <FormLabel>Email</FormLabel>
              <Input type='email' name='email' onChange={onChange} />
            </FormControl>
            <FormControl id='password' isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name='password'
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
            <Stack spacing={10} pt={2}>
              <Button
                loadingText='Submitting'
                size='lg'
                bg={'blue.400'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Please wait...' : 'Register'}
              </Button>
            </Stack>

            <Heading fontSize={'md'} textAlign={'center'}>
              OR
            </Heading>
            <Box display='flex' justifyContent='center'>
              <GoogleLogin
                onSuccess={({ credential: idToken }) => {
                  dispatch(loginWithGoogle({ idToken }))
                }}
                onError={() => {
                  toast({
                    title: 'Error',
                    description: 'Something went wrong',
                    status: 'error',
                  })
                }}
                useOneTap={!authUser}
                width={300}
                size='large'
                shape='pill'
                locale='en'
                theme='outline'
                text='continue_with'
              />
            </Box>
            <Stack pt={6}>
              <Text align={'center'}>
                Already a user? <Link href='/login'>Login</Link>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}
