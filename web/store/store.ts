import { configureStore } from '@reduxjs/toolkit'
import apiKeyReducer from './apiKeySlice'
import authReducer from './authSlice'
import deviceReducer from './deviceSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    apiKey: apiKeyReducer,
    device: deviceReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
