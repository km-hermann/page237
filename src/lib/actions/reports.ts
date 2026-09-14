'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/utils/turnstile'
import { ReportSchema } from '@/lib/schemas/report'

export async function reportListing(
  listingId: string,
  reason: string,
  turnstileToken: string
) {
  const supabase = await createClient()

  // 1. Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to report a listing' }
  }

  // 2. Verify Turnstile token
  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) {
    return { error: 'Security verification failed. Please try again.' }
  }

  // 3. Validate reason
  const validation = ReportSchema.safeParse({ reason })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // 4. Get reporter's profile ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profile not found' }
  }

  // 5. Insert report into DB
  const { error } = await supabase
    .from('reports')
    .insert({
      listing_id: listingId,
      reporter_id: profile.id,
      reason: validation.data.reason,
      status: 'open',
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
