import {
  Box,
  Flex,
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  Stack,
  useColorMode,
  Center,
  Image,
} from '@chakra-ui/react'
import Link from 'next/link'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import Router from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectAuth } from '../store/authReducer'

export default function Navbar() {
  const dispatch = useDispatch()
  const { colorMode, toggleColorMode } = useColorMode()
  const { user } = useSelector(selectAuth)

  return (
    <>
      <Box
        bg={useColorModeValue('gray.100', 'blue.600')}
        px={4}
        shadow='lg'
        mb={1}
      >
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <Link href='/' passHref>
            <Flex alignItems={'center'}>
              <Image
                alt={'Hero Image'}
                fit={'cover'}
                w={'30px'}
                h={'30px'}
                src={'/images/sms-gateway-logo.png'}
                borderRadius='full'
              />
              <Box style={{ cursor: 'pointer', marginLeft: '5px' }}>
                TextBee
              </Box>
            </Flex>
          </Link>

          <Flex alignItems={'center'}>
            <Stack direction={'row'} spacing={7}>
              <Button onClick={toggleColorMode}>
                {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              </Button>

              <Menu>
                <Link href='https://github.com/vernu/textbee' passHref>
                  <MenuButton>Github</MenuButton>
                </Link>
              </Menu>

              {!user ? (
                <>
                  <Menu>
                    <Link href='/login' passHref>
                      <MenuButton>Login</MenuButton>
                    </Link>
                    <Link href='/register' passHref>
                      <MenuButton>Register</MenuButton>
                    </Link>
                  </Menu>
                </>
              ) : (
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}
                  >
                    <Avatar
                      size={'sm'}
                      src={
                        user?.avatar ??
                        'https://avatars.dicebear.com/api/male/username.svg'
                      }
                    />
                  </MenuButton>
                  <MenuList alignItems={'center'}>
                    <br />
                    <Center>
                      <Avatar
                        size={'xl'}
                        src={
                          user?.avatar ??
                          'https://avatars.dicebear.com/api/male/username.svg'
                        }
                      />
                    </Center>
                    <br />
                    <Center>
                      <p>{user?.name}</p>
                    </Center>
                    <br />
                    <MenuDivider />
                    <MenuItem
                      onClick={() => {
                        Router.push('/dashboard')
                      }}
                    >
                      Dashboard
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        dispatch(logout())
                      }}
                    >
                      Logout
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  )
}
