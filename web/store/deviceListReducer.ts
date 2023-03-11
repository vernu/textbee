import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { getDeviceListRequest } from '../services'
import { createStandaloneToast } from '@chakra-ui/react'
import { RootState } from './store'

const toast = createStandaloneToast()

const initialState = {
  loading: false,
  data: [],
}

export const fetchDeviceList = createAsyncThunk(
  'deviceList/fetchDevices',
  async (payload, thunkAPI) => {
    try {
      const res = await getDeviceListRequest()
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Failed to Fetch devices',
        status: 'error',
      })
      return thunkAPI.rejectWithValue(e.response.data)
    }
  }
)

export const deviceListSlice = createSlice({
  name: 'deviceList',
  initialState,
  reducers: {
    clearDeviceList: (state) => {
      state.loading = false
      state.data = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeviceList.pending, (state) => {
        state.loading = true
      })
      .addCase(
        fetchDeviceList.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false
          state.data = action.payload
        }
      )
      .addCase(fetchDeviceList.rejected, (state) => {
        state.loading = false
      })
  },
})

export const { clearDeviceList } = deviceListSlice.actions

export const selectDeviceList = (state: RootState) => state.deviceList

export default deviceListSlice.reducer
