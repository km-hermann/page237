'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ListingCard, { type ListingCardItem } from '@/components/listings/ListingCard'
import styles from './ListingCarousel.module.css'

export interface ListingCarouselProps {
  items: ListingCardItem[]
  title?: string
  viewAllHref?: string
}

export default function ListingCarousel({
  items,
  title,
  viewAllHref = '/listings',
}: ListingCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -280,
        behavior: 'smooth',
      })
    }
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 280,
        behavior: 'smooth',
      })
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className={styles.section} aria-label={title || 'Book Listings Carousel'}>
      {(title || viewAllHref) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.navButton}
              onClick={handleScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.navButton}
              onClick={handleScrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>

            {viewAllHref && (
              <Link href={viewAllHref} className={styles.viewAllLink}>
                View All
              </Link>
            )}
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={styles.carousel}
        tabIndex={0}
        role="region"
        aria-label="Scrollable listings"
      >
        {items.map((item, index) => (
          <div key={item.id} className={styles.slide}>
            <ListingCard listing={item} priority={index < 3} />
          </div>
        ))}
      </div>
    </section>
  )
}
