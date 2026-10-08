import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Search, BookOpen, PlusCircle, ArrowRight, Book } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import PendingForm from '@/components/layout/PendingForm/PendingForm'
import ListingCarousel from '@/components/listings/ListingCarousel'
import type { ListingCardItem } from '@/components/listings/ListingCard'
import styles from './page.module.css'

async function getRecentListings(): Promise<ListingCardItem[]> {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      class:classes(name),
      subject:subjects(name)
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(8)

  return (listings as ListingCardItem[]) || []
}

export default async function Home() {
  const recentListings = isSupabaseConfigured() ? await getRecentListings() : []

  // Server Action for homepage search submission
  const handleSearchSubmit = async (formData: FormData) => {
    'use server'
    const query = formData.get('query') as string
    if (query) {
      redirect(`/listings?search=${encodeURIComponent(query)}`)
    } else {
      redirect('/listings')
    }
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>
          Find Your Textbooks, <br />
          <span className={styles.heroAccent}>Spend Less.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Cameroon&apos;s premier marketplace for second-hand textbooks, pamphlets, and class notes. Connect directly with other students and parents.
        </p>

        {/* Hero Search */}
        <PendingForm action={handleSearchSubmit} className={styles.searchForm}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            name="query"
            placeholder="What book are you looking for?"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchSubmit}>
            Search
          </button>
        </PendingForm>
      </section>

      {/* Features section */}
      <section className={styles.featuresGrid}>
        {/* Buyer Feature Card */}
        <div className={`${styles.featureCard} glass-panel`}>
          <div className={styles.featureIcon}>
            <BookOpen size={24} />
          </div>
          <h2 className={styles.featureTitle}>Looking for Books?</h2>
          <p className={styles.featureDesc}>
            Search through listings categorized by Section (Anglophone/Francophone), Class, and Subject. Find local sellers and purchase directly without middleman fees.
          </p>
          <Link href="/listings" className={styles.ctaLink}>
            Browse Books <ArrowRight size={16} />
          </Link>
        </div>

        {/* Seller Feature Card */}
        <div className={`${styles.featureCard} glass-panel`}>
          <div className={styles.featureIcon}>
            <PlusCircle size={24} />
          </div>
          <h2 className={styles.featureTitle}>Selling Old Books?</h2>
          <p className={styles.featureDesc}>
            Clear your shelves and make extra cash. Create a seller account, upload pictures of your old school books, and get contacted by buyers on WhatsApp.
          </p>
          <Link href="/dashboard" className={styles.ctaLink}>
            Start Selling <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Recent Listings Section */}
      <section className={styles.recentSection}>
        {recentListings.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Book size={32} style={{ margin: '0 auto 1rem auto', strokeWidth: 1.5 }} />
            <p>No listings posted yet. Be the first to list a book!</p>
          </div>
        ) : (
          <ListingCarousel
            title="Recently Added"
            items={recentListings}
            viewAllHref="/listings"
          />
        )}
      </section>
    </div>
  )
}
