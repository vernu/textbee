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
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteApiKeyRequest } from '../../services'
import {
  fetchApiKeyList,
  selectApiKeyList,
} from '../../store/apiKeyListReducer'
import { selectAuth } from '../../store/authReducer'

const ApiKeyList = () => {
  const toast = useToast()
  const dispatch = useDispatch()
  const { data, loading } = useSelector(selectApiKeyList)

  const { user, accessToken } = useSelector(selectAuth)
  useEffect(() => {
    if (user && accessToken) {
      dispatch(fetchApiKeyList())
    }
  }, [dispatch, user, accessToken])

  const onDelete = (apiKeyId: string) => {
    deleteApiKeyRequest(apiKeyId)
    dispatch(fetchApiKeyList())
    toast({
      title: 'Success',
      description: 'API Key deleted',
      isClosable: true,
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
          {loading ? (
            <Tr>
              <Td colSpan={3} textAlign='center'>
                <Spinner size='lg' />
              </Td>
            </Tr>
          ) : (
            <>
              {data.length == 0 ? (
                <Td colSpan={3} textAlign='center'>
                  No API Keys
                </Td>
              ) : (
                data.map(({ _id, apiKey, status }) => (
                  <Tr key={_id}>
                    <Td>{apiKey}</Td>
                    <Td>{status}</Td>
                    <Td>
                      <Tooltip label='Double Click to delete'>
                        <DeleteIcon
                          onDoubleClick={(e) => {
                            onDelete(_id)
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

export default ApiKeyList
