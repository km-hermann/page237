'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Book } from 'lucide-react'
import styles from '@/app/listings/[id]/page.module.css'

interface ImageGalleryProps {
  imageUrls: string[]
  title: string
}

export default function ImageGallery({ imageUrls, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className={styles.mainImageWrapper}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Book size={64} style={{ strokeWidth: 1 }} />
          <span style={{ fontSize: '0.95rem' }}>No photos available for this book</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.galleryContainer}>
      {/* Main Image */}
      <div className={styles.mainImageWrapper}>
        <Image
          src={imageUrls[activeIndex]}
          alt={`${title} — image ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          className={styles.mainImage}
          sizes="(max-width: 1024px) 100vw, 600px"
        />
      </div>

      {/* Thumbnails Row */}
      {imageUrls.length > 1 && (
        <div className={styles.thumbnailRow}>
          {imageUrls.map((url, index) => (
            <button
              key={index}
              className={`${styles.thumbnailWrapper} ${
                index === activeIndex ? styles.thumbnailActive : ''
              }`}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              aria-label={`View photo ${index + 1}`}
            >
              <Image
                src={url}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className={styles.thumbnail}
                sizes="70px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
