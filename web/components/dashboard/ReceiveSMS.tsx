import {
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  fetchReceivedSMSList,
  selectDeviceList,
  selectReceivedSMSList,
} from '../../store/deviceSlice'
import { useAppDispatch } from '../../store/hooks'
import { selectAuthUser } from '../../store/authSlice'

export default function ReceiveSMS() {
  return (
    <>
      <Grid
        templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }}
        gap={6}
      >
        <GridItem colSpan={2}>
          <ReceivedSMSList />
        </GridItem>
        <GridItem colSpan={1}>
          <ReceiveSMSNotifications />
        </GridItem>
      </Grid>
    </>
  )
}

const ReceiveSMSNotifications = () => {
  return (
    <Stack spacing={3}>
      <Alert status='success'>
        <AlertIcon />
        You can now receive SMS and view them in the dashboard, or retreive them
        via the API
      </Alert>

      <Alert status='warning'>
        <AlertIcon />
        To receive SMS, you need to have an active device that has receive SMS
        option enabled <small>(Turn on the switch in the app)</small>
      </Alert>

      <Alert status='info'>
        <AlertIcon />
        Webhooks will be available soon 😉
      </Alert>
    </Stack>
  )
}

const ReceivedSMSList = () => {
  const dispatch = useAppDispatch()

  const [tabIndex, setTabIndex] = useState(0)

  const { loading: receivedSMSListLoading, data: receivedSMSListData } =
    useSelector(selectReceivedSMSList)
  const deviceList = useSelector(selectDeviceList)

  const authUser = useSelector(selectAuthUser)

  const activeDeviceId = useMemo(() => {
    return deviceList[tabIndex]?._id
  }, [tabIndex, deviceList])

  useEffect(() => {
    if (authUser && activeDeviceId) {
      dispatch(fetchReceivedSMSList(activeDeviceId))
    }
  }, [dispatch, authUser, activeDeviceId])

  if (!receivedSMSListLoading && (!deviceList || deviceList.length == 0)) {
    return (
      <Alert status='warning'>
        <AlertIcon />
        You dont have any devices yet. Please register a device to receive SMS
      </Alert>
    )
  }

  return (
    <>
      <Tabs isLazy={false} index={tabIndex} onChange={setTabIndex}>
        <TabList>
          {deviceList.map(({ _id, brand, model }) => (
            <Tab key={_id}>{`${brand} ${model}`}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {deviceList.map(({ _id, brand, model }) => (
            <TabPanel key={_id}>
              <TableContainer>
                <Table variant='striped'>
                  <Thead>
                    <Tr>
                      <Th>sender</Th>
                      <Th>message</Th>
                      <Th>received at</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {receivedSMSListLoading && (
                      <Tr>
                        <Td colSpan={3} textAlign='center'>
                          <Spinner size='lg' />
                        </Td>
                      </Tr>
                    )}

                    {!receivedSMSListLoading &&
                      receivedSMSListData.length == 0 && (
                        <Td colSpan={3} textAlign='center'>
                          No SMS received
                        </Td>
                      )}

                    {!receivedSMSListLoading &&
                      receivedSMSListData.length > 0 &&
                      receivedSMSListData.map(
                        ({ _id, sender, message, receivedAt }) => (
                          <Tr key={_id}>
                            <Td>{sender}</Td>
                            <Td whiteSpace='pre-wrap' maxW='300px'>
                              {message}
                            </Td>
                            <Td>
                              {new Date(receivedAt).toLocaleString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                              })}
                            </Td>
                            <Td></Td>
                          </Tr>
                        )
                      )}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </>
  )
}
