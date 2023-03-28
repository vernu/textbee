import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  loginRequest,
  loginWithGoogleRequest,
  registerRequest,
} from '../services'
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

const toast = createStandaloneToast()

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
  async (payload: LoginRequestPayload, thunkAPI) => {
    try {
      const res = await loginRequest(payload)
      const { accessToken, user } = res
      saveUserAndToken(user, accessToken)
      Router.push('/')
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

export const loginWithGoogle = createAsyncThunk(
  'auth/google-login',
  async (payload: GoogleLoginRequestPayload, thunkAPI) => {
    try {
      const res = await loginWithGoogleRequest(payload)
      const { accessToken, user } = res
      saveUserAndToken(user, accessToken)
      Router.push('/')
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
      const res = await registerRequest(payload)
      const { accessToken, user } = res
      saveUserAndToken(user, accessToken)
      Router.push('/')
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

export const selectAuth = (state: RootState) => state.auth

export default authSlice.reducer
