import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ImageGallery from '@/components/listings/ImageGallery/ImageGallery'
import styles from './page.module.css'

interface ListingDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ListingDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('title, author, description')
    .eq('id', id)
    .single()

  if (!listing) {
    return {
      title: 'Listing Not Found — Page237',
    }
  }

  return {
    title: `${listing.title} — Page237`,
    description: listing.description || `Buy second-hand book "${listing.title}" on Page237.`,
  }
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch listing joined details
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      seller:profiles(full_name, role, created_at),
      section:sections(name),
      class:classes(name)
    `)
    .eq('id', id)
    .single()

  if (error || !listing || listing.status === 'removed') {
    notFound()
  }

  const seller = listing.seller as any
  const section = listing.section as any
  const classItem = listing.class as any

  const { data: subjectData } = await supabase
    .from('subjects')
    .select('name, active')
    .eq('id', listing.subject_id)
    .single()

  const subject = subjectData as any
  const isSubjectActive = (value: any) =>
    value === true || value === 'true' || value === 't' || value === '1'
  const showSubject = Boolean(subject?.name) && isSubjectActive(subject?.active)

  const memberSince = seller?.created_at
    ? new Date(seller.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const initialLetter = seller?.full_name ? seller.full_name.charAt(0).toUpperCase() : 'S'

  return (
    <div className={`${styles.container} container`}>
      <Link href="/listings" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to listings
      </Link>

      <div className={styles.layout}>
        {/* Left: Images */}
        <ImageGallery imageUrls={listing.image_urls} title={listing.title} />

        {/* Right: Info */}
        <div className={`${styles.infoCard} glass-panel`}>
          <h1 className={styles.title}>{listing.title}</h1>
          {listing.author && <p className={styles.author}>by {listing.author}</p>}

          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>Price</span>
            <span className={styles.price}>{Number(listing.price).toLocaleString()} FCFA</span>
          </div>

          <h3 className={styles.sectionHeader}>Book Details</h3>
          <div className={styles.tagsGrid}>
            <div className={styles.tagItem}>
              <span className={styles.tagLabel}>Section</span>
              <span className={styles.tagValue}>{section?.name}</span>
            </div>
            <div className={styles.tagItem}>
              <span className={styles.tagLabel}>Class</span>
              <span className={styles.tagValue}>{classItem?.name}</span>
            </div>
            {showSubject && (
              <div className={styles.tagItem}>
                <span className={styles.tagLabel}>Subject</span>
                <span className={styles.tagValue}>{subject?.name}</span>
              </div>
            )}
            <div className={styles.tagItem}>
              <span className={styles.tagLabel}>Condition</span>
              <span className={styles.tagValue} style={{ textTransform: 'capitalize' }}>
                {listing.condition}
              </span>
            </div>
          </div>

          {listing.description && (
            <>
              <h3 className={styles.sectionHeader}>Description</h3>
              <p className={styles.description}>{listing.description}</p>
            </>
          )}

          {/* Seller Card (No direct WhatsApp number here) */}
          <h3 className={styles.sectionHeader}>Seller Information</h3>
          <div className={styles.sellerCard}>
            <div className={styles.avatar}>{initialLetter}</div>
            <div className={styles.sellerInfo}>
              <span className={styles.sellerName}>{seller?.full_name || 'Anonymous Seller'}</span>
              <span className={styles.sellerMeta}>Member since {memberSince}</span>
              <span className={styles.sellerMeta} style={{ textTransform: 'capitalize', color: 'var(--accent)', fontWeight: 600 }}>
                {seller?.role}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            {listing.status === 'sold' ? (
              <button className={styles.contactBtn} style={{ background: 'var(--text-secondary)', cursor: 'not-allowed', boxShadow: 'none' }} disabled>
                Book Already Sold
              </button>
            ) : (
              <Link href={`/listings/${listing.id}/contact`} className={styles.contactBtn}>
                <MessageSquare size={18} />
                Contact Seller on WhatsApp
              </Link>
            )}

            {/* Low-emphasis report link */}
            <Link href={`/listings/${listing.id}/contact?report=true`} className={styles.reportLink}>
              <AlertTriangle size={14} />
              Report listing for fraud or incorrect details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
