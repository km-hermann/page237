import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContactClient from './ContactClient'

interface ContactPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata = {
  title: 'Contact Seller — Page237',
  description: 'Confirm and open a WhatsApp chat with the seller.',
}

export default async function ContactPage({ params, searchParams }: ContactPageProps) {
  const { id } = await params
  const sParams = await searchParams

  const isReport = sParams.report === 'true'

  const supabase = await createClient()

  // Verify auth session (backup redirect if proxy somehow skipped)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirectTo=/listings/${id}/contact${isReport ? '?report=true' : ''}`)
  }

  // Fetch listing details joined with seller info
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      price,
      status,
      seller:profiles(full_name)
    `)
    .eq('id', id)
    .single()

  if (error || !listing || listing.status === 'removed') {
    notFound()
  }

  const seller = listing.seller as any

  return (
    <ContactClient
      listingId={listing.id}
      listingTitle={listing.title}
      sellerName={seller?.full_name || 'Anonymous Seller'}
      listingPrice={Number(listing.price)}
      isReport={isReport}
    />
  )
}
