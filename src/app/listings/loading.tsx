import { ListingCardSkeleton } from '@/components/listings/ListingCard'
import cardStyles from '@/components/listings/ListingCard/ListingCard.module.css'
import styles from './page.module.css'

export default function Loading() {
  return (
    <div className={`${styles.container} container`} role="status" aria-label="Loading listings">
      <div className={styles.titleSection}>
        <div
          style={{ width: 'min(280px, 60%)', height: '2.25rem', borderRadius: '8px', marginBottom: '0.6rem' }}
          className={cardStyles.shimmer}
        />
        <div
          style={{ width: 'min(420px, 85%)', height: '1.05rem', borderRadius: '6px' }}
          className={cardStyles.shimmer}
        />
      </div>

      <div className={styles.layoutWrapper}>
        <aside className={styles.sidebar}>
          <div
            style={{ minHeight: '340px', borderRadius: 'var(--border-radius-md)', width: '100%' }}
            className={cardStyles.shimmer}
          />
        </aside>

        <div className={styles.mainContent}>
          <div className={styles.grid}>
            {Array.from({ length: 8 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
