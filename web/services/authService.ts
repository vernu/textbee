import httpClient from '../lib/httpClient'
import {
  GoogleLoginRequestPayload,
  LoginRequestPayload,
  LoginResponse,
  RegisterRequestPayload,
  RegisterResponse,
} from './types'

class AuthService {
  async login(payload: LoginRequestPayload): Promise<LoginResponse> {
    const res = await httpClient.post(`/auth/login`, payload)
    return res.data.data
  }

  async loginWithGoogle(
    payload: GoogleLoginRequestPayload
  ): Promise<LoginResponse> {
    const res = await httpClient.post(`/auth/google-login`, payload)
    return res.data.data
  }

  async register(payload: RegisterRequestPayload): Promise<RegisterResponse> {
    const res = await httpClient.post(`/auth/register`, payload)
    return res.data.data
  }

  async getCurrentUser() {
    const res = await httpClient.get(`/auth/who-am-i`)
    return res.data.data
  }

  async requestPasswordReset({ email }) {
    const res = await httpClient.post(`/auth/request-password-reset`, {
      email,
    })
    return res.data.data
  }

  async resetPassword({ email, otp, newPassword }) {
    const res = await httpClient.post(`/auth/reset-password`, {
      email,
      otp,
      newPassword,
    })
    return res.data.data
  }

  async whoAmI() {
    const res = await httpClient.get(`/auth/who-am-i`)
    return res.data.data
  }
}

export const authService = new AuthService()
