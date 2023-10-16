import { DeleteIcon } from '@chakra-ui/icons'
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
import { selectAuthUser } from '../../store/authSlice'
import { fetchDevices, selectDeviceList, selectDeviceLoading } from '../../store/deviceSlice'

const DeviceRow = ({ device }: any) => {
  const { enabled, model, brand, _id, createdAt } = device
  return (
    <Tr>
      <Td>{`${brand}/ ${model}`}</Td>
      <Td>{enabled ? 'enabled' : 'disabled'}</Td>
      <Td>{/* <EmailIcon onDoubleClick={(e) => {}} /> */}</Td>
      <Td>
        <Tooltip label='Double Click to delete'>
          <IconButton
            aria-label='Delete'
            icon={<DeleteIcon />}
            onDoubleClick={(e) => {}}
          />
        </Tooltip>
      </Td>
    </Tr>
  )
}

const DeviceList = () => {
  const dispatch = useDispatch()

  const authUser = useSelector(selectAuthUser)
  useEffect(() => {
    if (authUser) {
      dispatch(fetchDevices())
    }
  }, [authUser, dispatch])

  const deviceList = useSelector(selectDeviceList)
  const loading = useSelector(selectDeviceLoading)

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
          {loading && (
            <Tr>
              <Td colSpan={3} textAlign='center'>
                <Spinner size='lg' />
              </Td>
            </Tr>
          )}

          {!loading && deviceList.length === 0 && (
            <Tr>
              <Td colSpan={3} textAlign='center'>
                No Devices
              </Td>
            </Tr>
          )}

          {!loading &&
            deviceList.length > 0 &&
            deviceList.map((device) => (
              <DeviceRow key={device._id} device={device} />
            ))}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default DeviceList
