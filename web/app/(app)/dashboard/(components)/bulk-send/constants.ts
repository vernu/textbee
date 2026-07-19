export const MAX_FILE_SIZE = 1024 * 1024 // 1 MB
export const FALLBACK_MAX_ROWS = 50
export const SAMPLE_CSV = '/samples/bulk-sms-sample.csv'
export const PREVIEW_ROWS = 5

export const REASON_LABEL: Record<string, string> = {
  empty: 'no phone number',
  invalid: 'not a valid phone number',
  duplicate: 'duplicate number',
}
