import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createStandaloneToast } from '@chakra-ui/react'
import { RootState } from './store'
import { statsService } from '../services/statsService'

const { toast } = createStandaloneToast()

const initialState = {
  loading: false,
  data: {
    totalApiKeyCount: 0,
    totalDeviceCount: 0,
    totalReceivedSMSCount: 0,
    totalSentSMSCount: 0,
  },
}

export const fetchStats = createAsyncThunk(
  'gateway/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await statsService.getStats()
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Failed to Fetch stats',
        status: 'error',
      })
      return rejectWithValue(e.response.data)
    }
  }
)

export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchStats.rejected, (state) => {
        state.loading = false
      })
      .addMatcher(isAnyOf(fetchStats.pending), (state) => {
        state.loading = true
      })
  },
})

export const selectStatsLoading = (state: RootState) => state.stats.loading
export const selectStatsData = (state: RootState) => state.stats.data

export default statsSlice.reducer
