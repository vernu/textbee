import { z } from 'zod'

export const sendSmsSchema = z.object({
  deviceId: z.string().min(1, {
    message: 'Please select a device',
  }),
  recipients: z
    .array(
      z.string().regex(/^\+?\d{1,14}$/, {
        message: 'Please enter a valid phone number',
      })
    )
    .min(1, {
      message: 'At least one recipient is required',
    }),
  message: z
    .string()
    .min(1, {
      message: 'Message is required',
    })
    .max(1600, {
      message: 'Message cannot exceed 1600 characters',
    }),
})

export type SendSmsFormData = z.infer<typeof sendSmsSchema>

// export const bulkSmsSchema = z.object({
//   deviceId: z.string().uuid({
//     message: 'Please select a device',
//   }),
//   file: z.instanceof(File, {
//     message: 'Please upload a CSV file',
//   }),
//   messageTemplate: z
//     .string()
//     .min(1, {
//       message: 'Message template is required',
//     })
//     .max(1600, {
//       message: 'Message template cannot exceed 1600 characters',
//     }),
// })

// export type BulkSmsFormData = z.infer<typeof bulkSmsSchema>
