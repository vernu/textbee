import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createStandaloneToast } from '@chakra-ui/react'
import Router from 'next/router'
import { RootState } from './store'
import {
  AuthState,
  GoogleLoginRequestPayload,
  LoginRequestPayload,
  RegisterRequestPayload,
} from '../services/types'
import { removeUserAndToken, saveUserAndToken } from '../shared/utils'
import { LOCAL_STORAGE_KEY } from '../shared/constants'
import { googleLogout } from '@react-oauth/google'
import { authService } from '../services/authService'
const { toast } = createStandaloneToast()

const initialState: AuthState = {
  loading: false,
  accessToken:
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEY.TOKEN)
      : null,
  user:
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY.USER))
      : null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginRequestPayload, { rejectWithValue }) => {
    try {
      const res = await authService.login(payload)
      const { accessToken, user } = res
      saveUserAndToken(user, accessToken)
      Router.push('/dashboard')
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Login failed',
        status: 'error',
      })
      return rejectWithValue(e.response.data)
    }
  }
)

export const loginWithGoogle = createAsyncThunk(
  'auth/google-login',
  async (payload: GoogleLoginRequestPayload, thunkAPI) => {
    try {
      const res = await authService.loginWithGoogle(payload)
      const { accessToken, user } = res
      saveUserAndToken(user, accessToken)
      Router.push('/dashboard')
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Login failed',
        status: 'error',
      })
      return thunkAPI.rejectWithValue(e.response.data)
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterRequestPayload, thunkAPI) => {
    try {
      const res = await authService.register(payload)
      const { accessToken, user } = res
      saveUserAndToken(user, accessToken)
      Router.push('/dashboard')
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Signup failed',
        status: 'error',
      })
      return thunkAPI.rejectWithValue(e.response.data)
    }
  }
)

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      removeUserAndToken()
      googleLogout()
      state.accessToken = null
      state.user = null
      Router.push('/login')
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        isAnyOf(login.fulfilled, register.fulfilled, loginWithGoogle.fulfilled),
        (state, action: PayloadAction<any>) => {
          state.loading = false
          state.user = action.payload.user
          state.accessToken = action.payload.accessToken
        }
      )
      .addMatcher(isAnyOf(login.rejected, register.rejected), (state) => {
        state.loading = false
        state.user = null
        state.accessToken = null
      })
      .addMatcher(isAnyOf(login.pending, register.pending), (state) => {
        state.loading = true
      })
  },
})

export const { logout } = authSlice.actions

export const selectAuthLoading = (state: RootState) => state.auth.loading
export const selectAuthUser = (state: RootState) => state.auth.user
export const selectAuthAccessToken = (state: RootState) =>
  state.auth.accessToken

export default authSlice.reducer
