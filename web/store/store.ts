import { configureStore } from '@reduxjs/toolkit'
import apiKeyListReducer from './apiKeyListReducer'
import authReducer from './authReducer'
import deviceListReducer from './deviceListReducer'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    apiKeyList: apiKeyListReducer,
    deviceList: deviceListReducer,
  },
  enhancers: [],
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
