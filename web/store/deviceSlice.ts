import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createStandaloneToast } from '@chakra-ui/react'
import { RootState } from './store'
import { gatewayService } from '../services/gatewayService'

const toast = createStandaloneToast()

const initialState = {
  loading: false,
  item: null,
  list: [],
  sendingSMS: false,
}

export const fetchDevices = createAsyncThunk(
  'device/fetchDevices',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await gatewayService.getDeviceList()
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Failed to Fetch devices',
        status: 'error',
      })
      return rejectWithValue(e.response.data)
    }
  }
)

export const sendSMS = createAsyncThunk(
  'device/sendSMS',
  async ({ deviceId, payload }: any, { rejectWithValue }) => {
    try {
      const res = await gatewayService.sendSMS(deviceId, payload)
      toast({
        title: 'SMS sent successfully',
        status: 'success',
      })
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Failed to send SMS',
        status: 'error',
      })
      return rejectWithValue(e.response.data)
    }
  }
)

export const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    clearDeviceList: (state) => {
      state.loading = false
      state.list = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchDevices.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchDevices.rejected, (state) => {
        state.loading = false
      })
      .addCase(sendSMS.pending, (state) => {
        state.sendingSMS = true
      })
      .addCase(sendSMS.fulfilled, (state) => {
        state.sendingSMS = false
      })
      .addCase(sendSMS.rejected, (state) => {
        state.sendingSMS = false
      })
  },
})

export const { clearDeviceList } = deviceSlice.actions

export const selectDeviceList = (state: RootState) => state.device.list
export const selectDeviceItem = (state: RootState) => state.device.item
export const selectDeviceLoading = (state: RootState) => state.device.loading
export const selectSendingSMS = (state: RootState) => state.device.sendingSMS

export default deviceSlice.reducer
