import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateListing } from '@/lib/actions/listings'
import ListingForm from '@/components/forms/ListingForm/ListingForm'
import styles from '../../new/page.module.css'

interface EditListingPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Edit Book Listing — Page237',
  description: 'Modify details of your second-hand book listing.',
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params

  const supabase = await createClient()

  // Verify auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/${id}/edit`)
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'seller') {
    redirect('/')
  }

  // Fetch listing and taxonomy in parallel
  const [listingRes, sectionsRes, classesRes, subjectsRes] = await Promise.all([
    supabase.from('listings').select('*').eq('id', id).single(),
    supabase.from('sections').select('id, name').order('display_order', { ascending: true }),
    supabase.from('classes').select('id, name, section_id').order('display_order', { ascending: true }),
    supabase.from('subjects').select('id, name').eq('active', true).order('name', { ascending: true }),
  ])

  const listing = listingRes.data
  const sections = sectionsRes.data || []
  const classes = classesRes.data || []
  const subjects = subjectsRes.data || []

  if (listingRes.error || !listing) {
    notFound()
  }

  // Check ownership
  if (listing.seller_id !== profile.id) {
    redirect('/dashboard')
  }

  // Ensure listing status is not 'removed'
  if (listing.status === 'removed') {
    redirect('/dashboard')
  }

  const initialData = {
    id: listing.id,
    title: listing.title,
    author: listing.author,
    description: listing.description,
    price: Number(listing.price),
    condition: listing.condition as 'new' | 'good' | 'fair' | 'worn',
    section_id: listing.section_id,
    class_id: listing.class_id,
    subject_id: listing.subject_id,
    image_urls: listing.image_urls,
  }

  // Wrap the server action to include the listing id
  const updateListingAction = async (values: any) => {
    'use server'
    return updateListing(id, values)
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <h1 className={styles.title}>Edit Book Listing</h1>
        <p className={styles.subtitle}>Update the details of your textbook or pamphlet listing.</p>
        
        <ListingForm
          sections={sections}
          classes={classes}
          subjects={subjects}
          initialData={initialData}
          onSubmitAction={updateListingAction}
        />
      </div>
    </div>
  )
}
