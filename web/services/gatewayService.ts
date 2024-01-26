import httpClient from '../lib/httpClient'
import { SendSMSRequestPayload } from './types'

class GatewayService {
  async generateApiKey() {
    const res = await httpClient.post(`/auth/api-keys`, {})
    return res.data.data
  }

  async getApiKeyList() {
    const res = await httpClient.get(`/auth/api-keys`)
    return res.data.data
  }

  async deleteApiKey(id: string) {
    const res = await httpClient.delete(`/auth/api-keys/${id}`)
    return res.data.data
  }

  async getDeviceList() {
    const res = await httpClient.get(`/gateway/devices`)
    return res.data.data
  }

  async deleteDevice(id: string) {
    const res = await httpClient.delete(`/gateway/devices/${id}`)
    return res.data.data
  }

  async sendSMS(deviceId: string, payload: SendSMSRequestPayload) {
    const res = await httpClient.post(
      `/gateway/devices/${deviceId}/sendSMS`,
      payload
    )
    return res.data.data
  }
}

export const gatewayService = new GatewayService()
