import axios from '../lib/customAxios'
import {
  GoogleLoginRequestPayload,
  LoginRequestPayload,
  LoginResponse,
  RegisterRequestPayload,
  RegisterResponse,
  SendSMSRequestPayload,
} from './types'

export const loginRequest = async (
  payload: LoginRequestPayload
): Promise<LoginResponse> => {
  const res = await axios.post(`/auth/login`, payload)
  return res.data.data
}

export const loginWithGoogleRequest = async (
  payload: GoogleLoginRequestPayload
): Promise<LoginResponse> => {
  const res = await axios.post(`/auth/google-login`, payload)
  return res.data.data
}

export const registerRequest = async (
  payload: RegisterRequestPayload
): Promise<RegisterResponse> => {
  const res = await axios.post(`/auth/register`, payload)
  return res.data.data
}

export const getCurrentUserRequest = async () => {
  const res = await axios.get(`/auth/who-am-i`)
  return res.data.data
}

export const generateApiKeyRequest = async () => {
  const res = await axios.post(`/auth/api-keys`, {})
  return res.data.data
}

export const getApiKeyListRequest = async () => {
  const res = await axios.get(`/auth/api-keys`)
  return res.data.data
}

export const deleteApiKeyRequest = async (id: string) => {
  const res = await axios.delete(`/auth/api-keys/${id}`)
  return res.data.data
}

export const getDeviceListRequest = async () => {
  const res = await axios.get(`/gateway/devices`)
  return res.data.data
}

export const sendSMSRequest = async (
  deviceId: string,
  payload: SendSMSRequestPayload
) => {
  const res = await axios.post(
    `/gateway/devices/${deviceId}/sendSMS`,
    payload
  )
  return res.data.data
}
