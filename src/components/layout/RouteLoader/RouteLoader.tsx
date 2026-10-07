import { ListingCardSkeleton } from '@/components/listings/ListingCard'
import styles from './RouteLoader.module.css'

export default function RouteLoader({
  title = 'Turning the page…',
  subtitle = 'Loading the next view',
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true">
        <span className={`${styles.ring} ${styles.ringOuter}`} />
        <span className={`${styles.ring} ${styles.ringInner}`} />
      </div>
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  )
}

export function ListingsSkeleton() {
  return (
    <div className={styles.page} role="status" aria-live="polite" aria-label="Loading listings">
      <div className={`${styles.heading} ${styles.shimmer}`} />
      <div className={`${styles.subheading} ${styles.shimmer}`} />
      <div className={`${styles.filter} ${styles.shimmer}`} />
      <div className={styles.grid}>
        {Array.from({ length: 8 }, (_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export function ListingDetailSkeleton() {
  return (
    <div className={styles.page} role="status" aria-live="polite" aria-label="Loading listing">
      <div className={styles.detailLayout}>
        <div className={`${styles.gallery} ${styles.shimmer}`} />
        <div className={`${styles.info} glass-panel`} />
      </div>
    </div>
  )
}
