import { z } from 'zod'

export const ContactSchema = z.object({
  message: z.string()
    .min(10, 'Your message must be at least 10 characters')
    .max(500, 'Your message must be under 500 characters'),
})

export type ContactFormValues = z.infer<typeof ContactSchema>
