import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import FilterBar from '@/components/listings/FilterBar/FilterBar'
import ListingCard, { type ListingCardItem } from '@/components/listings/ListingCard'
import styles from './page.module.css'

export const metadata = {
  title: 'Browse Books — Page237',
  description: 'Search and filter second-hand school textbooks and pamphlets in Cameroon.',
}

interface ListingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams

  const search = (params.search as string) || ''
  const section = (params.section as string) || ''
  const classId = (params.class as string) || ''
  const subject = (params.subject as string) || ''
  const condition = (params.condition as string) || ''
  const minPrice = (params.minPrice as string) || ''
  const maxPrice = (params.maxPrice as string) || ''
  const sort = (params.sort as string) || 'newest'

  const supabase = await createClient()

  // 1. Fetch taxonomy in parallel for the FilterBar
  const [sectionsRes, classesRes, subjectsRes] = await Promise.all([
    supabase.from('sections').select('id, name').order('display_order', { ascending: true }),
    supabase.from('classes').select('id, name, section_id').order('display_order', { ascending: true }),
    supabase.from('subjects').select('id, name').eq('active', true).order('name', { ascending: true }),
  ])

  const sections = sectionsRes.data || []
  const classes = classesRes.data || []
  const subjects = subjectsRes.data || []
  const activeSubjectIds = subjects.map((item) => item.id)

  // 2. Build database query for available listings
  let query = supabase
    .from('listings')
    .select(`
      *,
      section:sections(name),
      class:classes(name),
      subject:subjects(name)
    `)
    .eq('status', 'available')

  // Apply filters
  if (activeSubjectIds.length > 0) {
    query = query.not('subject_id', 'is', null).in('subject_id', activeSubjectIds)
  } else {
    query = query.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
  }
  if (section) {
    query = query.eq('section_id', section)
  }
  if (classId) {
    query = query.eq('class_id', classId)
  }
  if (subject) {
    query = query.eq('subject_id', subject)
  }
  if (condition) {
    const conditions = condition.split(',').filter(Boolean)
    if (conditions.length > 0) {
      query = query.in('condition', conditions)
    }
  }
  if (minPrice) {
    query = query.gte('price', parseFloat(minPrice))
  }
  if (maxPrice) {
    query = query.lte('price', parseFloat(maxPrice))
  }

  // Apply sorting
  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: listings, error } = await query

  if (error) {
    console.error('Listings fetch error:', error)
  }

  const availableListings: ListingCardItem[] = (listings as ListingCardItem[]) || []

  return (
    <div className={`${styles.container} container`}>
      <div className={styles.titleSection}>
        <h1 className={styles.pageTitle}>Book Marketplace</h1>
        <p className={styles.pageSubtitle}>Find second-hand textbooks, notebooks, and study pamphlets.</p>
      </div>

      <div className={styles.layoutWrapper}>
        <aside className={styles.sidebar}>
          <FilterBar sections={sections} classes={classes} subjects={subjects} />
        </aside>

        <div className={styles.mainContent}>
          {/* Empty State */}
          {availableListings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <BookOpen size={36} strokeWidth={1.75} />
              </div>
              <h2 className={styles.emptyTitle}>No books match your filters</h2>
              <p className={styles.emptyDesc}>
                We couldn&apos;t find any books matching your selected criteria. Try broadening your criteria or clearing all filters.
              </p>
              <Link href="/listings" className={styles.resetButton}>
                Reset Filters
              </Link>
            </div>
          ) : (
            /* Listings Grid */
            <div className={styles.grid}>
              {availableListings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
