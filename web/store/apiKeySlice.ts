import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createStandaloneToast } from '@chakra-ui/react'
import { RootState } from './store'
import { gatewayService } from '../services/gatewayService'

const toast = createStandaloneToast()

const initialState = {
  loading: false,
  item: null,
  list: [],
}

export const fetchApiKeys = createAsyncThunk(
  'apiKey/fetchApiKeys',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await gatewayService.getApiKeyList()
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Failed to Fetch apiKeys',
        status: 'error',
      })
      return rejectWithValue(e.response.data)
    }
  }
)

export const deleteApiKey = createAsyncThunk(
  'apiKey/deleteApiKey',
  async (apiKeyId: string, { dispatch, rejectWithValue }) => {
    try {
      const res = await gatewayService.deleteApiKey(apiKeyId)
      dispatch(fetchApiKeys())
      toast({
        title: 'ApiKey deleted successfully',
        status: 'success',
      })
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Failed to delete ApiKey',
        status: 'error',
      })
      return rejectWithValue(e.response.data)
    }
  }
)

export const apiKeySlice = createSlice({
  name: 'apiKey',
  initialState,
  reducers: {
    clearApiKeyList: (state) => {
      state.loading = false
      state.list = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiKeys.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchApiKeys.rejected, (state) => {
        state.loading = false
      })
      .addMatcher(
        isAnyOf(fetchApiKeys.pending, deleteApiKey.pending),
        (state) => {
          state.loading = true
        }
      )
  },
})

export const { clearApiKeyList } = apiKeySlice.actions

export const selectApiKeyLoading = (state: RootState) => state.apiKey.loading
export const selectApiKeyList = (state: RootState) => state.apiKey.list
export const selectApiKeyItem = (state: RootState) => state.apiKey.item

export default apiKeySlice.reducer
