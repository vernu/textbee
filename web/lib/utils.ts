import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return phoneNumber

  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '')

  // If it's a US number (10 digits) or US number with country code (11 digits starting with 1)
  if (cleaned.length === 10) {
    // Assume US number, prepend +1
    return `+1${cleaned}`
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number with country code, add +
    return `+${cleaned}`
  }

  // For other formats, if it doesn't start with +, prepend it
  if (cleaned.length > 0 && !phoneNumber.startsWith('+')) {
    return `+${cleaned}`
  }

  // Return cleaned version or original if already normalized
  return cleaned ? `+${cleaned}` : phoneNumber
}
