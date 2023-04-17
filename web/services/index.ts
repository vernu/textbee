import axiosInstance from '../lib/axiosInstance'
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
  const res = await axiosInstance.post(`/auth/login`, payload)
  return res.data.data
}

export const loginWithGoogleRequest = async (
  payload: GoogleLoginRequestPayload
): Promise<LoginResponse> => {
  const res = await axiosInstance.post(`/auth/google-login`, payload)
  return res.data.data
}

export const registerRequest = async (
  payload: RegisterRequestPayload
): Promise<RegisterResponse> => {
  const res = await axiosInstance.post(`/auth/register`, payload)
  return res.data.data
}

export const generateApiKeyRequest = async () => {
  const res = await axiosInstance.post(`/auth/api-keys`, {})
  return res.data.data
}

export const getApiKeyListRequest = async () => {
  const res = await axiosInstance.get(`/auth/api-keys`)
  return res.data.data
}

export const deleteApiKeyRequest = async (id: string) => {
  const res = await axiosInstance.delete(`/auth/api-keys/${id}`)
  return res.data.data
}

export const getDeviceListRequest = async () => {
  const res = await axiosInstance.get(`/gateway/devices`)
  return res.data.data
}

export const sendSMSRequest = async (
  deviceId: string,
  payload: SendSMSRequestPayload
) => {
  const res = await axiosInstance.post(
    `/gateway/devices/${deviceId}/sendSMS`,
    payload
  )
  return res.data.data
}
