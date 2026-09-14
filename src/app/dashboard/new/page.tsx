import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createListing } from '@/lib/actions/listings'
import ListingForm from '@/components/forms/ListingForm/ListingForm'
import styles from './page.module.css'

export const metadata = {
  title: 'Post a Book — Page237',
  description: 'Post a new second-hand textbook or class notes for sale.',
}

export default async function NewListingPage() {
  const supabase = await createClient()

  // Verify seller auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirectTo=/dashboard/new')
  }

  // Fetch profiles role to verify seller
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'seller') {
    redirect('/')
  }

  // Fetch taxonomy parallelly
  const [sectionsRes, classesRes, subjectsRes] = await Promise.all([
    supabase.from('sections').select('id, name').order('display_order', { ascending: true }),
    supabase.from('classes').select('id, name, section_id').order('display_order', { ascending: true }),
    supabase.from('subjects').select('id, name').eq('active', true).order('name', { ascending: true }),
  ])

  const sections = sectionsRes.data || []
  const classes = classesRes.data || []
  const subjects = subjectsRes.data || []

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <h1 className={styles.title}>Post a Book</h1>
        <p className={styles.subtitle}>Fill in details to list your book or pamphlet for sale.</p>
        
        <ListingForm
          sections={sections}
          classes={classes}
          subjects={subjects}
          onSubmitAction={createListing}
        />
      </div>
    </div>
  )
}
