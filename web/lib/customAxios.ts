import axios from 'axios'
import { LOCAL_STORAGE_KEY } from '../shared/constants'

const customAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

customAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEY.TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default customAxios
