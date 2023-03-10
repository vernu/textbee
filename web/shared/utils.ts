import { UserEntity } from '../services/types'
import { LOCAL_STORAGE_KEY } from './constants'

export const saveUserAndToken = (user: UserEntity, accessToken: string) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY.USER, JSON.stringify(user))
    localStorage.setItem(LOCAL_STORAGE_KEY.TOKEN, accessToken)
  }
}

export const removeUserAndToken = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY.USER)
    localStorage.removeItem(LOCAL_STORAGE_KEY.TOKEN)
  }
}
