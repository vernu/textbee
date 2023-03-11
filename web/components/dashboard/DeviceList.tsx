import { DeleteIcon, EmailIcon } from '@chakra-ui/icons'
import {
  IconButton,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
} from '@chakra-ui/react'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { sendSMSRequest } from '../../services'
import { selectAuth } from '../../store/authReducer'
import {
  fetchDeviceList,
  selectDeviceList,
} from '../../store/deviceListReducer'

const DeviceList = () => {
  const dispatch = useDispatch()

  const { user, accessToken } = useSelector(selectAuth)
  useEffect(() => {
    if (user && accessToken) {
      dispatch(fetchDeviceList())
    }
  }, [user, accessToken, dispatch])

  const { data, loading } = useSelector(selectDeviceList)

  const onDelete = (apiKeyId: string) => {}

  return (
    <TableContainer>
      <Table variant='simple'>
        <Thead>
          <Tr>
            <Th>Your Devices</Th>
            <Th>Status</Th>
            <Th colSpan={2}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Td colSpan={3} textAlign='center'>
                <Spinner size='lg' />
              </Td>
            </Tr>
          ) : (
            <>
              {data.length === 0 ? (
                <Tr>
                  <Td colSpan={3} textAlign='center'>
                    No Devices
                  </Td>
                </Tr>
              ) : (
                data.map(({ _id, brand, model, enabled, createdAt }) => (
                  <Tr key={_id}>
                    <Td>{`${brand}/ ${model}`}</Td>
                    <Td>{enabled ? 'enabled' : 'disabled'}</Td>
                    <Td>
                      <EmailIcon onDoubleClick={(e) => {}} />
                    </Td>
                    <Td>
                      <Tooltip label='Double Click to delete'>
                        <IconButton
                          aria-label='Delete'
                          icon={<DeleteIcon />}
                          onDoubleClick={(e) => {
                            sendSMSRequest(_id, {
                              receivers: ['+251912657519'],
                              smsBody: 'Hello World',
                            })
                          }}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))
              )}
            </>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default DeviceList
