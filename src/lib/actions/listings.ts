'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingSchema, type ListingFormValues } from '@/lib/schemas/listing'

// Helper to authenticate and get current seller's profile ID
async function getSellerProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Profile not found')
  }

  if (profile.role !== 'seller') {
    throw new Error('Only sellers can perform this action')
  }

  return profile.id
}

export async function createListing(values: ListingFormValues) {
  let sellerId: string
  try {
    sellerId = await getSellerProfile()
  } catch (err: any) {
    return { error: err.message }
  }

  // Validate fields
  const validation = ListingSchema.safeParse(values)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: sellerId,
      title: validation.data.title,
      author: validation.data.author || null,
      description: validation.data.description || null,
      price: validation.data.price,
      condition: validation.data.condition,
      section_id: validation.data.sectionId,
      class_id: validation.data.classId,
      subject_id: validation.data.subjectId,
      image_urls: validation.data.imageUrls,
      status: 'available',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/listings')
  revalidatePath('/dashboard')
  return { success: true, listingId: data.id }
}

export async function updateListing(listingId: string, values: ListingFormValues) {
  let sellerId: string
  try {
    sellerId = await getSellerProfile()
  } catch (err: any) {
    return { error: err.message }
  }

  // Validate fields
  const validation = ListingSchema.safeParse(values)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  // First verify ownership of the listing
  const { data: existing, error: checkError } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', listingId)
    .single()

  if (checkError || !existing) {
    return { error: 'Listing not found' }
  }

  if (existing.seller_id !== sellerId) {
    return { error: 'You do not own this listing' }
  }

  const { error } = await supabase
    .from('listings')
    .update({
      title: validation.data.title,
      author: validation.data.author || null,
      description: validation.data.description || null,
      price: validation.data.price,
      condition: validation.data.condition,
      section_id: validation.data.sectionId,
      class_id: validation.data.classId,
      subject_id: validation.data.subjectId,
      image_urls: validation.data.imageUrls,
    })
    .eq('id', listingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/listings')
  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteListing(listingId: string) {
  let sellerId: string
  try {
    sellerId = await getSellerProfile()
  } catch (err: any) {
    return { error: err.message }
  }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing, error: checkError } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', listingId)
    .single()

  if (checkError || !existing) {
    return { error: 'Listing not found' }
  }

  if (existing.seller_id !== sellerId) {
    return { error: 'You do not own this listing' }
  }

  // Soft delete listing by marking it as 'removed'
  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', listingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/listings')
  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markAsSold(listingId: string) {
  let sellerId: string
  try {
    sellerId = await getSellerProfile()
  } catch (err: any) {
    return { error: err.message }
  }

  const supabase = await createClient()

  // Verify ownership
  const { data: existing, error: checkError } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', listingId)
    .single()

  if (checkError || !existing) {
    return { error: 'Listing not found' }
  }

  if (existing.seller_id !== sellerId) {
    return { error: 'You do not own this listing' }
  }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', listingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/listings')
  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/dashboard')
  return { success: true }
}
