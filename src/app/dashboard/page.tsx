import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { PlusCircle, Book, Tag, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DashboardActions from './DashboardActions'
import styles from './page.module.css'

export const metadata = {
  title: 'Seller Dashboard — Page237',
  description: 'Manage your book listings and see views on Page237.',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verify auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirectTo=/dashboard')
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

  // Fetch listings owned by this seller (excluding soft-deleted)
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      section:sections(name),
      class:classes(name),
      subject:subjects!subject_id(name, active)
    `)
    .eq('seller_id', profile.id)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })

  const myListings = listings || []
  
  // Calculate Stats
  const totalListings = myListings.length
  const soldListings = myListings.filter(l => l.status === 'sold').length
  const availableListings = totalListings - soldListings

  return (
    <div className={`${styles.container} container`}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Seller Dashboard</h1>
          <p className={styles.subtitle}>Manage your textbooks, pamphlets, and notes for sale.</p>
        </div>
        <Link href="/dashboard/new" className={`${styles.actionBtn} glass-panel`} style={{ padding: '0.75rem 1.25rem' }}>
          <PlusCircle size={18} />
          Post a Book
        </Link>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} glass-panel`}>
          <span className={styles.statLabel}>Total Listings</span>
          <span className={styles.statValue}>{totalListings}</span>
        </div>
        <div className={`${styles.statCard} glass-panel`}>
          <span className={styles.statLabel}>Available Books</span>
          <span className={styles.statValue} style={{ color: 'var(--success)' }}>{availableListings}</span>
        </div>
        <div className={`${styles.statCard} glass-panel`}>
          <span className={styles.statLabel}>Sold Books</span>
          <span className={styles.statValue} style={{ color: 'var(--text-secondary)' }}>{soldListings}</span>
        </div>
      </div>

      {/* Empty State */}
      {myListings.length === 0 ? (
        <div className={`${styles.emptyState} glass-panel`}>
          <Book size={48} className="text-accent" />
          <h2 className={styles.emptyTitle}>No Listings Yet</h2>
          <p className={styles.emptyDesc}>
            You haven't listed any books for sale. Click the button below to post your first textbook or pamphlet!
          </p>
          <Link href="/dashboard/new" className={styles.actionBtn} style={{ padding: '0.75rem 1.5rem', marginTop: '0.5rem' }}>
            Post a Book
          </Link>
        </div>
      ) : (
        /* Listings Grid */
        <div className={styles.listingsGrid}>
          {myListings.map((listing) => (
            <div key={listing.id} className={`${styles.card} glass-panel`}>
              <div className={styles.imageWrapper}>
                {listing.image_urls && listing.image_urls.length > 0 ? (
                  <Image
                    src={listing.image_urls[0]}
                    alt={listing.title}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Book size={36} style={{ strokeWidth: 1.5 }} />
                    <span style={{ fontSize: '0.8rem' }}>No Photo</span>
                  </div>
                )}
                
                {/* Status badge */}
                <div className={`${styles.statusBadge} ${listing.status === 'available' ? styles.statusAvailable : styles.statusSold}`}>
                  {listing.status}
                </div>

                {/* Price tag */}
                <div className={styles.priceBadge}>
                  {Number(listing.price).toLocaleString()} FCFA
                </div>
              </div>

              <div className={styles.cardContent}>
                <h3 className={listing.status === 'sold' ? `${styles.listingTitle} text-muted` : styles.listingTitle} title={listing.title}>
                  {listing.title}
                </h3>
                {listing.author && (
                  <p className={styles.listingAuthor}>by {listing.author}</p>
                )}

                {/* Badges */}
                <div className={styles.details}>
                  <span className={styles.badge}>{(listing.section as any)?.name}</span>
                  <span className={styles.badge}>{(listing.class as any)?.name}</span>
                  {(() => {
                    const subject = Array.isArray(listing.subject) ? listing.subject[0] : listing.subject
                    const isSubjectActive = (value: any) =>
                      value === true || value === 'true' || value === 't' || value === '1'
                    const showSubject = Boolean(subject?.name) && isSubjectActive(subject?.active)
                    return showSubject ? <span className={styles.badge}>{subject?.name}</span> : null
                  })()}
                  <span className={styles.badge} style={{ textTransform: 'capitalize' }}>{listing.condition}</span>
                </div>

                {/* Action buttons */}
                <DashboardActions listingId={listing.id} status={listing.status as 'available' | 'sold'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
