import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageSquare, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ImageGallery from '@/components/listings/ImageGallery/ImageGallery'
import { formatDisplayText } from '@/lib/utils/text'
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

  const title = formatDisplayText(listing.title)

  return {
    title: `${title} — Page237`,
    description: listing.description || `Buy second-hand book "${title}" on Page237.`,
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

  const seller = listing.seller as { full_name?: string | null; role?: string | null; created_at?: string | null } | null
  const section = listing.section as { name?: string | null } | null
  const classItem = listing.class as { name?: string | null } | null

  const { data: subjectData } = await supabase
    .from('subjects')
    .select('name, active')
    .eq('id', listing.subject_id)
    .single()

  const subject = subjectData as { name?: string | null; active?: boolean | string } | null
  const isSubjectActive = (value: unknown) =>
    value === true || value === 'true' || value === 't' || value === '1'
  const showSubject = Boolean(subject?.name) && isSubjectActive(subject?.active)

  const memberSince = seller?.created_at
    ? new Date(seller.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const rawTitle = listing.title || ''
  const displayTitle = formatDisplayText(rawTitle)
  const displayAuthor = listing.author ? formatDisplayText(listing.author) : null
  const sellerFullName = seller?.full_name ? formatDisplayText(seller.full_name) : 'Anonymous Seller'
  const sellerRole = seller?.role ? formatDisplayText(seller.role) : 'Seller'
  const initialLetter = sellerFullName.charAt(0).toUpperCase() || 'S'
  const formattedPrice = new Intl.NumberFormat('fr-CM').format(Number(listing.price))

  return (
    <div className={`${styles.container} container`}>
      <Link href="/listings" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to listings
      </Link>

      <div className={styles.layout}>
        {/* Left: Images */}
        <ImageGallery imageUrls={listing.image_urls} title={displayTitle} />

        {/* Right: Info */}
        <div className={`${styles.infoCard} glass-panel`}>
          <h1 className={styles.title}>{displayTitle}</h1>
          {displayAuthor && (
            <p className={styles.author}>
              <span className={styles.byPrefix}>by </span>
              {displayAuthor}
            </p>
          )}

          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>Price</span>
            <div className={styles.price}>
              {formattedPrice}
              <span className={styles.priceCurrency}>FCFA</span>
            </div>
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
              <span className={styles.sellerName}>{sellerFullName}</span>
              {memberSince && <span className={styles.sellerMeta}>Member since {memberSince}</span>}
              <span className={styles.roleBadge}>{sellerRole}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            {listing.status === 'sold' ? (
              <button
                className={styles.contactBtn}
                style={{ background: 'var(--text-secondary)', cursor: 'not-allowed', boxShadow: 'none' }}
                disabled
              >
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
