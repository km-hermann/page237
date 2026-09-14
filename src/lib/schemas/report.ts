import { z } from 'zod'

export const ReportSchema = z.object({
  reason: z.string()
    .min(10, 'Please explain the reason in at least 10 characters')
    .max(500, 'Your explanation must be under 500 characters'),
})

export type ReportFormValues = z.infer<typeof ReportSchema>
