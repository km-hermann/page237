import Link from 'next/link'
import Image from 'next/image'
import { Book } from 'lucide-react'
import { formatDisplayText } from '@/lib/utils/text'
import styles from './ListingCard.module.css'

export interface ListingCardItem {
  id: string
  title: string
  author?: string | null
  price: number | string
  condition?: 'new' | 'good' | 'fair' | 'worn' | string | null
  image_urls?: string[] | null
  class?: { name: string } | null
  subject?: { name: string } | null
  section?: { name: string } | null
}

export interface ListingCardProps {
  listing: ListingCardItem
  priority?: boolean
}

function formatFCFA(value: number | string): string {
  const numericPrice = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numericPrice)) return '0 FCFA'
  return `${new Intl.NumberFormat('fr-CM').format(numericPrice)} FCFA`
}

function getConditionBadgeInfo(condition?: string | null): { label: string; className: string } | null {
  if (!condition) return null
  const normalized = condition.toLowerCase().trim()

  switch (normalized) {
    case 'new':
      return { label: 'New', className: styles.badgeNew }
    case 'good':
      return { label: 'Good', className: styles.badgeGood }
    case 'fair':
      return { label: 'Fair', className: styles.badgeFair }
    case 'worn':
      return { label: 'Worn', className: styles.badgeWorn }
    default:
      return {
        label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        className: styles.badgeFair,
      }
  }
}

export default function ListingCard({ listing, priority = false }: ListingCardProps) {
  const imageUrl = listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls[0] : null
  const conditionInfo = getConditionBadgeInfo(listing.condition)
  const formattedPrice = formatFCFA(listing.price)

  const metaParts = [listing.class?.name, listing.subject?.name].filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  )
  const metaText = metaParts.length > 0 ? metaParts.join(' • ') : null
  const displayTitle = formatDisplayText(listing.title)

  return (
    <article className={styles.card}>
      <Link
        href={`/listings/${listing.id}`}
        className={styles.link}
        aria-label={`${displayTitle} - ${formattedPrice}`}
      >
        {/* Media Box */}
        <div className={styles.imageContainer}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayTitle}
              fill
              className={styles.image}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              priority={priority}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <div className={styles.placeholderPattern} />
              <div className={styles.placeholderIconWrap}>
                <Book size={24} strokeWidth={1.75} />
              </div>
              <span className={styles.placeholderBrand}>PAGE 237</span>
            </div>
          )}

          {conditionInfo && (
            <span className={`${styles.badge} ${conditionInfo.className}`}>
              {conditionInfo.label}
            </span>
          )}
        </div>

        {/* Content Box */}
        <div className={styles.content}>
          <h3 className={styles.title} title={displayTitle}>
            {displayTitle}
          </h3>

          {metaText && (
            <p className={styles.meta} title={metaText}>
              {metaText}
            </p>
          )}

          {/* Price Footer */}
          <div className={styles.footer}>
            <span className={styles.price}>{formattedPrice}</span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export function ListingCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={`${styles.skeletonImage} ${styles.shimmer}`} />
      <div className={styles.content}>
        <div className={`${styles.skeletonLine} ${styles.skeletonTitle1} ${styles.shimmer}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonTitle2} ${styles.shimmer}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonMeta} ${styles.shimmer}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonPrice} ${styles.shimmer}`} />
      </div>
    </article>
  )
}
