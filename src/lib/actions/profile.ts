'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ProfileUpdateSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be under 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, or apostrophes'),
  whatsappNumber: z.string()
    .min(9, 'WhatsApp number must be at least 9 digits')
    .max(15, 'WhatsApp number is too long')
    .regex(/^\+?[0-9]+$/, 'WhatsApp number must contain only digits and optional leading +')
    .transform((val) => {
      let cleaned = val.replace(/\s+/g, '')
      if (!cleaned.startsWith('+')) {
        if (cleaned.startsWith('237')) {
          return `+${cleaned}`
        }
        return `+237${cleaned}`
      }
      return cleaned
    }),
})

export async function updateProfile(values: { fullName: string; whatsappNumber: string }) {
  const supabase = await createClient()

  // 1. Verify auth session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // 2. Validate inputs
  const validation = ProfileUpdateSchema.safeParse(values)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // 3. Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: validation.data.fullName,
      whatsapp_number: validation.data.whatsappNumber,
    })
    .eq('user_id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // 4. Update auth user metadata to keep in sync
  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      full_name: validation.data.fullName,
      whatsapp_number: validation.data.whatsappNumber,
    },
  })

  if (metaError) {
    console.error('Failed to update auth metadata:', metaError)
  }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}
