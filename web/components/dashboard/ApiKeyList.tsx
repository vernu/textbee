import { DeleteIcon } from '@chakra-ui/icons'
import {
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
import { useSelector } from 'react-redux'
import {
  deleteApiKey,
  fetchApiKeys,
  selectApiKeyList,
  selectApiKeyLoading,
} from '../../store/apiKeySlice'
import { selectAuthUser } from '../../store/authSlice'
import { useAppDispatch } from '../../store/hooks'

const ApiKeyRow = ({ apiKey }: any) => {
  const dispatch = useAppDispatch()

  const handleDelete = async () => {
    dispatch(deleteApiKey(apiKey._id))
  }

  return (
    <Tr>
      <Td>{apiKey.apiKey}</Td>
      <Td>{apiKey.status}</Td>
      <Td>
        <Tooltip label='Double Click to delete'>
          <DeleteIcon
            // onDoubleClick={handleDelete}
          />
        </Tooltip>
      </Td>
    </Tr>
  )
}

const ApiKeyList = () => {
  const dispatch = useAppDispatch()
  const loading = useSelector(selectApiKeyLoading)
  const apiKeyList = useSelector(selectApiKeyList)

  const authUser = useSelector(selectAuthUser)
  useEffect(() => {
    if (authUser) {
      dispatch(fetchApiKeys())
    }
  }, [dispatch, authUser])

  return (
    <TableContainer>
      <Table variant='simple'>
        <Thead>
          <Tr>
            <Th>Your API Keys</Th>
            <Th>Status</Th>
            <Th></Th>
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

          {!loading && apiKeyList.length == 0 && (
            <Td colSpan={3} textAlign='center'>
              No API Keys
            </Td>
          )}

          {!loading &&
            apiKeyList.length > 0 &&
            apiKeyList.map((apiKey) => (
              <ApiKeyRow key={apiKey._id} apiKey={apiKey} />
            ))}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default ApiKeyList
