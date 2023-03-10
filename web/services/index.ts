import axios from 'axios'
import {
  LoginRequestPayload,
  LoginResponse,
  RegisterRequestPayload,
  RegisterResponse,
} from './types'
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (typeof localStorage !== 'undefined')
  axios.defaults.headers.common[
    'Authorization'
  ] = `Bearer ${localStorage.accessToken}`

export const loginRequest = async (
  payload: LoginRequestPayload
): Promise<LoginResponse> => {
  const res = await axios.post(`${BASE_URL}/auth/login`, payload)
  return res.data.data
}

export const registerRequest = async (
  payload: RegisterRequestPayload
): Promise<RegisterResponse> => {
  const res = await axios.post(`${BASE_URL}/auth/register`, payload)
  return res.data.data
}

export const generateApiKeyRequest = async () => {
  const res = await axios.post(`${BASE_URL}/auth/api-keys`, {})
  return res.data.data
}

export const getApiKeyListRequest = async () => {
  const res = await axios.get(`${BASE_URL}/auth/api-keys`)
  return res.data.data
}

export const deleteApiKeyRequest = async (id: string) => {
  const res = await axios.delete(`${BASE_URL}/auth/api-keys/${id}`)
  return res.data.data
}
