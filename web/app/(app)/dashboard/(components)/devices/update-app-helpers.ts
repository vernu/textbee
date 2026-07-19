'use client'

import { useCallback, useEffect, useState } from 'react'

export type DeviceVersionCandidate = {
  _id: string
  brand: string
  model: string
  name?: string | null
  appVersionCode?: number | null
  appVersionInfo?: {
    versionCode?: number | null
  } | null
}

export const DEFAULT_LATEST_APP_VERSION_CODE = 17
export const UPDATE_APP_REMIND_LATER_MS = 6 * 60 * 60 * 1000
export const UPDATE_APP_DONT_ASK_AGAIN_MS = 30 * 24 * 60 * 60 * 1000

const UPDATE_APP_SNOOZE_KEY = 'update_app_prompt_snooze_until'
const UPDATE_APP_SNOOZE_EVENT = 'update-app-prompt-snooze-changed'

const envLatestVersionCode = Number.parseInt(
  process.env.NEXT_PUBLIC_LATEST_APP_VERSION_CODE?.trim() ?? '',
  10
)

export const latestAppVersionCode =
  Number.isFinite(envLatestVersionCode) && envLatestVersionCode > 0
    ? envLatestVersionCode
    : DEFAULT_LATEST_APP_VERSION_CODE

export function getDeviceVersionCode(device: DeviceVersionCandidate) {
  const heartbeatVersionCode = device.appVersionInfo?.versionCode

  if (typeof heartbeatVersionCode === 'number') {
    return heartbeatVersionCode
  }

  return typeof device.appVersionCode === 'number' ? device.appVersionCode : null
}

export function isDeviceOutdated(
  device: DeviceVersionCandidate,
  latestVersionCode = latestAppVersionCode
) {
  const deviceVersionCode = getDeviceVersionCode(device)

  if (deviceVersionCode === null) {
    return false
  }

  return deviceVersionCode < latestVersionCode
}

export function getOutdatedDevices(
  devices: DeviceVersionCandidate[] | undefined,
  latestVersionCode = latestAppVersionCode
) {
  if (!devices?.length) {
    return []
  }

  return devices.filter((device) => isDeviceOutdated(device, latestVersionCode))
}

export function summarizeOutdatedDeviceNames(
  devices: DeviceVersionCandidate[],
  formatDeviceName: (device: DeviceVersionCandidate) => string,
  visibleCount = 3
) {
  const visibleDevices = devices.slice(0, visibleCount).map(formatDeviceName)
  const remainingCount = Math.max(devices.length - visibleDevices.length, 0)

  if (visibleDevices.length === 0) {
    return ''
  }

  if (visibleDevices.length === 1) {
    return visibleDevices[0]
  }

  if (visibleDevices.length === 2) {
    return remainingCount > 0
      ? `${visibleDevices[0]}, ${visibleDevices[1]} and ${remainingCount} more device${
          remainingCount > 1 ? 's' : ''
        }`
      : `${visibleDevices[0]} and ${visibleDevices[1]}`
  }

  const namedPrefix = `${visibleDevices[0]}, ${visibleDevices[1]} and ${visibleDevices[2]}`

  return remainingCount > 0
    ? `${namedPrefix} and ${remainingCount} more device${
        remainingCount > 1 ? 's' : ''
      }`
    : namedPrefix
}

function readUpdatePromptSnoozeUntil() {
  if (typeof window === 'undefined') {
    return 0
  }

  const value = window.localStorage.getItem(UPDATE_APP_SNOOZE_KEY)
  const parsedValue = value ? Number.parseInt(value, 10) : 0

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function emitUpdatePromptSnoozeChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(UPDATE_APP_SNOOZE_EVENT))
}

export function setUpdatePromptSnooze(durationMs: number) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    UPDATE_APP_SNOOZE_KEY,
    (Date.now() + durationMs).toString()
  )
  emitUpdatePromptSnoozeChanged()
}

export function useUpdatePromptSnooze() {
  const [snoozeUntil, setSnoozeUntil] = useState(0)

  const refreshSnoozeUntil = useCallback(() => {
    setSnoozeUntil(readUpdatePromptSnoozeUntil())
  }, [])

  useEffect(() => {
    refreshSnoozeUntil()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSnoozeUntil()
      }
    }

    window.addEventListener('storage', refreshSnoozeUntil)
    window.addEventListener(
      UPDATE_APP_SNOOZE_EVENT,
      refreshSnoozeUntil as EventListener
    )
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', refreshSnoozeUntil)
      window.removeEventListener(
        UPDATE_APP_SNOOZE_EVENT,
        refreshSnoozeUntil as EventListener
      )
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshSnoozeUntil])

  return {
    isSnoozed: snoozeUntil > Date.now(),
    snoozeUntil,
    refreshSnoozeUntil,
  }
}
