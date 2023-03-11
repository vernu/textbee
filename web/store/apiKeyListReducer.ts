import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { getApiKeyListRequest } from '../services'
import { createStandaloneToast } from '@chakra-ui/react'
import { RootState } from './store'

const toast = createStandaloneToast()

const initialState = {
  loading: false,
  data: [],
}

export const fetchApiKeyList = createAsyncThunk(
  'apiKeyList/fetchApiKeys',
  async (payload, thunkAPI) => {
    try {
      const res = await getApiKeyListRequest()
      return res
    } catch (e) {
      toast({
        title: e.response.data.error || 'Failed to Fetch apiKeys',
        status: 'error',
      })
      return thunkAPI.rejectWithValue(e.response.data)
    }
  }
)

export const apiKeyListSlice = createSlice({
  name: 'apiKeyList',
  initialState,
  reducers: {
    clearApiKeyList: (state) => {
      state.loading = false
      state.data = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiKeyList.pending, (state) => {
        state.loading = true
      })
      .addCase(
        fetchApiKeyList.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false
          state.data = action.payload
        }
      )
      .addCase(fetchApiKeyList.rejected, (state) => {
        state.loading = false
      })
  },
})

export const { clearApiKeyList } = apiKeyListSlice.actions

export const selectApiKeyList = (state: RootState) => state.apiKeyList

export default apiKeyListSlice.reducer
