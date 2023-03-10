import { DeleteIcon } from '@chakra-ui/icons'
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { deleteApiKeyRequest, getApiKeyListRequest } from '../../services'
import { selectAuth } from '../../store/authSlice'

const ApiKeyList = () => {
  const [apiKeyList, setApiKeyList] = useState([])
  const toast = useToast()

  const { user, accessToken } = useSelector(selectAuth)
  useEffect(() => {
    if (user && accessToken) {
      getApiKeyListRequest().then((apiKeys) => {
        setApiKeyList(apiKeys)
      })
    }
  }, [user, accessToken])

  const onDelete = (apiKeyId: string) => {
    deleteApiKeyRequest(apiKeyId)
    setApiKeyList(apiKeyList.filter((apiKey) => apiKey._id !== apiKeyId))
    toast({
      title: 'Success',
      description: 'API Key deleted',
    })
  }

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
          {apiKeyList.map((apiKey) => (
            <Tr key={apiKey}>
              <Td>{apiKey.apiKey}</Td>
              <Td>{apiKey.status}</Td>
              <Td>
                <Tooltip label='Double Click to delete'>
                  <DeleteIcon
                    onDoubleClick={(e) => {
                      onDelete(apiKey._id)
                    }}
                  />
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default ApiKeyList
