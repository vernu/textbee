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
  Image,
  SimpleGrid,
} from '@chakra-ui/react'
import Link from 'next/link'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import Router from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectAuthUser } from '../store/authSlice'

export default function Navbar() {
  const dispatch = useDispatch()
  const { colorMode, toggleColorMode } = useColorMode()
  const authUser = useSelector(selectAuthUser)

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

              {!authUser && (
                <Menu>
                  <Link href='/login' passHref>
                    <MenuButton>Login</MenuButton>
                  </Link>
                  <Link href='/register' passHref>
                    <MenuButton>Register</MenuButton>
                  </Link>
                </Menu>
              )}

              {authUser && (
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
                      name={authUser.name}
                      src={authUser?.avatar}
                    />
                  </MenuButton>
                  <MenuList alignItems={'center'}>
                    <MenuItem>
                      <SimpleGrid columns={2} spacing={3}>
                        <Avatar
                          size={'sm'}
                          name={authUser.name}
                          src={authUser?.avatar}
                        />
                        {authUser?.name}
                      </SimpleGrid>
                    </MenuItem>

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
