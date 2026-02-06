import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats device display name with optional custom name in brackets
 * @param device Device object with brand, model, and optional name
 * @returns Formatted string like "Brand Model" or "Brand Model (Custom Name)"
 */
export function formatDeviceName(device: {
  brand: string
  model: string
  name?: string | null
}): string {
  const baseName = `${device.brand} ${device.model}`
  
  if (device.name && device.name.trim() !== '' && device.name !== baseName) {
    return `${baseName} (${device.name})`
  }
  
  return baseName
}
