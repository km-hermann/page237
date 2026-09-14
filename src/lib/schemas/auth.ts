import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export const SignupSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be under 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, or apostrophes'),
  whatsappNumber: z.string()
    .min(9, 'WhatsApp number must be at least 9 digits')
    .max(15, 'WhatsApp number is too long')
    .regex(/^\+?[0-9]+$/, 'WhatsApp number must contain only digits and optional leading +')
    .transform((val) => {
      // Normalize: if it doesn't start with a '+', prepend '+237' (defaulting to Cameroon if no prefix)
      // If it starts with '237', prepend '+'
      // Otherwise keep it as is
      let cleaned = val.replace(/\s+/g, '')
      if (!cleaned.startsWith('+')) {
        if (cleaned.startsWith('237')) {
          return `+${cleaned}`
        }
        return `+237${cleaned}`
      }
      return cleaned
    }),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['buyer', 'seller']).refine((value) => value === 'buyer' || value === 'seller', {
    message: 'Please select whether you are a buyer or a seller',
  }),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const ResetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type LoginFormValues = z.infer<typeof LoginSchema>
export type SignupFormValues = z.infer<typeof SignupSchema>
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>
