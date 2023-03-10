import { configureStore } from '@reduxjs/toolkit'
import authSlice from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
  },
  enhancers: [],
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
