'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/utils/turnstile'
import { buildWhatsAppUrl } from '@/lib/utils/whatsapp'
import { ContactSchema } from '@/lib/schemas/contact'

export async function contactSeller(
  listingId: string,
  message: string,
  turnstileToken: string
) {
  const supabase = await createClient()

  // 1. Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to contact a seller' }
  }

  // 2. Verify Turnstile token
  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) {
    return { error: 'Security verification failed. Please try again.' }
  }

  // 3. Validate message length
  const validation = ContactSchema.safeParse({ message })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // 4. Fetch seller WhatsApp number
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      title,
      status,
      seller:profiles(whatsapp_number)
    `)
    .eq('id', listingId)
    .single()

  if (error || !listing) {
    return { error: 'Listing not found' }
  }

  if (listing.status !== 'available') {
    return { error: 'This listing is no longer available' }
  }

  const sellerProfile = listing.seller as any
  const sellerNumber = sellerProfile?.whatsapp_number

  if (!sellerNumber) {
    return { error: 'Seller contact details are missing. Please contact support.' }
  }

  // 5. Build WhatsApp Url
  const whatsappUrl = buildWhatsAppUrl(sellerNumber, validation.data.message)

  return { success: true, whatsappUrl }
}
