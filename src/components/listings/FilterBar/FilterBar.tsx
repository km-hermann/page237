'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronDown, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import styles from './FilterBar.module.css'
import Input from '@/components/ui/Input/Input'
import Select from '@/components/ui/Select/Select'
import Button from '@/components/ui/Button/Button'

interface TaxonomyItem {
  id: string
  name: string
}

interface ClassItem extends TaxonomyItem {
  section_id: string
}

interface FilterBarProps {
  sections: TaxonomyItem[]
  classes: ClassItem[]
  subjects: TaxonomyItem[]
}

export default function FilterBar({ sections, classes, subjects }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)

  // Local state mirroring query parameters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedSection, setSelectedSection] = useState(searchParams.get('section') || '')
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '')
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '')
  const [selectedCondition, setSelectedCondition] = useState<string[]>(
    searchParams.get('condition')?.split(',').filter(Boolean) || []
  )
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')

  // Sync state with URL params when URL changes
  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    setSelectedSection(searchParams.get('section') || '')
    setSelectedClass(searchParams.get('class') || '')
    setSelectedSubject(searchParams.get('subject') || '')
    setSelectedCondition(searchParams.get('condition')?.split(',').filter(Boolean) || [])
    setMinPrice(searchParams.get('minPrice') || '')
    setMaxPrice(searchParams.get('maxPrice') || '')
    setSortBy(searchParams.get('sort') || 'newest')
  }, [searchParams])

  // Clear class selection when section changes
  useEffect(() => {
    if (selectedSection) {
      const match = classes.find((c) => c.id === selectedClass && c.section_id === selectedSection)
      if (!match) setSelectedClass('')
    } else {
      setSelectedClass('')
    }
  }, [selectedSection, classes, selectedClass])

  const filteredClasses = classes.filter((c) => c.section_id === selectedSection)

  // Helper to compile search params and update URL
  const applyFilters = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, value)
      }
    })

    // Reset pagination if present
    params.delete('page')

    router.push(`/listings?${params.toString()}`)
    setActivePanel(null)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ search })
  }

  const handleClearFilter = (key: string) => {
    applyFilters({ [key]: null })
  }

  const handleClearAll = () => {
    router.push('/listings')
    setIsMobileSheetOpen(false)
  }

  const handleConditionToggle = (condition: string) => {
    setSelectedCondition((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    )
  }

  // Active filter helper for rendering pills
  const activeFilters: Array<{ key: string; label: string; displayValue: string }> = []
  if (searchParams.get('search')) {
    activeFilters.push({ key: 'search', label: 'Search', displayValue: `"${searchParams.get('search')}"` })
  }
  if (searchParams.get('section')) {
    const sName = sections.find((s) => s.id === searchParams.get('section'))?.name
    if (sName) activeFilters.push({ key: 'section', label: 'Section', displayValue: sName })
  }
  if (searchParams.get('class')) {
    const cName = classes.find((c) => c.id === searchParams.get('class'))?.name
    if (cName) activeFilters.push({ key: 'class', label: 'Class', displayValue: cName })
  }
  if (searchParams.get('subject')) {
    const subName = subjects.find((s) => s.id === searchParams.get('subject'))?.name
    if (subName) activeFilters.push({ key: 'subject', label: 'Subject', displayValue: subName })
  }
  if (searchParams.get('condition')) {
    activeFilters.push({
      key: 'condition',
      label: 'Condition',
      displayValue: searchParams.get('condition')!,
    })
  }
  if (searchParams.get('minPrice') || searchParams.get('maxPrice')) {
    const min = searchParams.get('minPrice') || '0'
    const max = searchParams.get('maxPrice') || '∞'
    activeFilters.push({ key: 'price', label: 'Price', displayValue: `${min}-${max} FCFA` })
  }

  return (
    <div className={styles.filterBarContainer}>
      {/* Search and Mobile Buttons */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search book title or author..."
            className={`${styles.searchInput} glass-panel`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* Mobile Buttons */}
        <div className={styles.mobileBar}>
          <button className={styles.chipButton} onClick={() => setIsMobileSheetOpen(true)}>
            <SlidersHorizontal size={14} />
            Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                applyFilters({ sort: e.target.value })
              }}
              style={{ padding: '0.4rem 2rem 0.4rem 0.8rem', backgroundPosition: 'right 0.5rem center', fontSize: '0.85rem' }}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop filter row */}
      <div className={styles.desktopBar}>
        {/* Section dropdown */}
        <div className={styles.chipContainer}>
          <button
            className={`${styles.chipButton} ${searchParams.get('section') ? styles.chipButtonActive : ''}`}
            onClick={() => setActivePanel(activePanel === 'section' ? null : 'section')}
          >
            Section {searchParams.get('section') && '•'} <ChevronDown size={14} />
          </button>
          {activePanel === 'section' && (
            <div className={`${styles.dropdownPanel} glass-panel`}>
              <h4 className={styles.panelTitle}>Section</h4>
              <div className={styles.optionList}>
                {sections.map((s) => (
                  <label key={s.id} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="section"
                      checked={selectedSection === s.id}
                      onChange={() => setSelectedSection(s.id)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              <div className={styles.panelActions}>
                <button
                  className={styles.clearAllBtn}
                  onClick={() => {
                    setSelectedSection('')
                    applyFilters({ section: null, class: null })
                  }}
                >
                  Clear
                </button>
                <Button
                  size="small"
                  onClick={() => applyFilters({ section: selectedSection, class: null })}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Class dropdown (cascading) */}
        <div className={styles.chipContainer}>
          <button
            className={`${styles.chipButton} ${searchParams.get('class') ? styles.chipButtonActive : ''}`}
            disabled={!selectedSection}
            onClick={() => setActivePanel(activePanel === 'class' ? null : 'class')}
          >
            Class {searchParams.get('class') && '•'} <ChevronDown size={14} />
          </button>
          {activePanel === 'class' && (
            <div className={`${styles.dropdownPanel} glass-panel`}>
              <h4 className={styles.panelTitle}>Class</h4>
              <div className={styles.optionList}>
                {filteredClasses.map((c) => (
                  <label key={c.id} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="class"
                      checked={selectedClass === c.id}
                      onChange={() => setSelectedClass(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              <div className={styles.panelActions}>
                <button
                  className={styles.clearAllBtn}
                  onClick={() => {
                    setSelectedClass('')
                    applyFilters({ class: null })
                  }}
                >
                  Clear
                </button>
                <Button size="small" onClick={() => applyFilters({ class: selectedClass })}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Subject dropdown */}
        <div className={styles.chipContainer}>
          <button
            className={`${styles.chipButton} ${searchParams.get('subject') ? styles.chipButtonActive : ''}`}
            onClick={() => setActivePanel(activePanel === 'subject' ? null : 'subject')}
          >
            Subject {searchParams.get('subject') && '•'} <ChevronDown size={14} />
          </button>
          {activePanel === 'subject' && (
            <div className={`${styles.dropdownPanel} glass-panel`}>
              <h4 className={styles.panelTitle}>Subject</h4>
              <div className={styles.optionList}>
                {subjects.map((s) => (
                  <label key={s.id} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name="subject"
                      checked={selectedSubject === s.id}
                      onChange={() => setSelectedSubject(s.id)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              <div className={styles.panelActions}>
                <button
                  className={styles.clearAllBtn}
                  onClick={() => {
                    setSelectedSubject('')
                    applyFilters({ subject: null })
                  }}
                >
                  Clear
                </button>
                <Button size="small" onClick={() => applyFilters({ subject: selectedSubject })}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Condition Dropdown */}
        <div className={styles.chipContainer}>
          <button
            className={`${styles.chipButton} ${searchParams.get('condition') ? styles.chipButtonActive : ''}`}
            onClick={() => setActivePanel(activePanel === 'condition' ? null : 'condition')}
          >
            Condition {searchParams.get('condition') && '•'} <ChevronDown size={14} />
          </button>
          {activePanel === 'condition' && (
            <div className={`${styles.dropdownPanel} glass-panel`}>
              <h4 className={styles.panelTitle}>Condition</h4>
              <div className={styles.optionList}>
                {['new', 'good', 'fair', 'worn'].map((c) => (
                  <label key={c} className={styles.checkboxLabel} style={{ textTransform: 'capitalize' }}>
                    <input
                      type="checkbox"
                      checked={selectedCondition.includes(c)}
                      onChange={() => handleConditionToggle(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
              <div className={styles.panelActions}>
                <button
                  className={styles.clearAllBtn}
                  onClick={() => {
                    setSelectedCondition([])
                    applyFilters({ condition: null })
                  }}
                >
                  Clear
                </button>
                <Button size="small" onClick={() => applyFilters({ condition: selectedCondition })}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Price Dropdown */}
        <div className={styles.chipContainer}>
          <button
            className={`${styles.chipButton} ${(searchParams.get('minPrice') || searchParams.get('maxPrice')) ? styles.chipButtonActive : ''}`}
            onClick={() => setActivePanel(activePanel === 'price' ? null : 'price')}
          >
            Price {(searchParams.get('minPrice') || searchParams.get('maxPrice')) && '•'} <ChevronDown size={14} />
          </button>
          {activePanel === 'price' && (
            <div className={`${styles.dropdownPanel} glass-panel`}>
              <h4 className={styles.panelTitle}>Price Range</h4>
              <div className={styles.priceRangeInput}>
                <input
                  type="number"
                  placeholder="Min FCFA"
                  className={styles.priceInput}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Max FCFA"
                  className={styles.priceInput}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div className={styles.panelActions}>
                <button
                  className={styles.clearAllBtn}
                  onClick={() => {
                    setMinPrice('')
                    setMaxPrice('')
                    applyFilters({ minPrice: null, maxPrice: null })
                  }}
                >
                  Clear
                </button>
                <Button size="small" onClick={() => applyFilters({ minPrice, maxPrice })}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sort select */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              applyFilters({ sort: e.target.value })
            }}
            style={{ padding: '0.4rem 2rem 0.4rem 0.8rem', backgroundPosition: 'right 0.5rem center', fontSize: '0.85rem' }}
          >
            <option value="newest">Newest Listed</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Removable Active filter pills */}
      {activeFilters.length > 0 && (
        <div className={styles.pillsRow}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Filters:</span>
          {activeFilters.map((pill) => (
            <span key={pill.key} className={styles.pill}>
              {pill.label}: {pill.displayValue}
              <button
                className={styles.removePillBtn}
                onClick={() => {
                  if (pill.key === 'price') {
                    applyFilters({ minPrice: null, maxPrice: null })
                  } else if (pill.key === 'section') {
                    applyFilters({ section: null, class: null })
                  } else {
                    handleClearFilter(pill.key)
                  }
                }}
                aria-label={`Remove filter ${pill.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button className={styles.clearAllBtn} onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      )}

      {/* Mobile Filter Sheet Modal */}
      {isMobileSheetOpen && (
        <>
          <div className={styles.mobileSheetOverlay} onClick={() => setIsMobileSheetOpen(false)} />
          <div className={styles.mobileSheet}>
            <div className={styles.mobileSheetHeader}>
              <span className={styles.mobileSheetTitle}>Filters</span>
              <button
                className={styles.removePillBtn}
                onClick={() => setIsMobileSheetOpen(false)}
                style={{ width: '36px', height: '36px', border: '1px solid var(--glass-border)', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.mobileSheetContent}>
              {/* Section */}
              <div className={styles.mobileFieldGroup}>
                <span className={styles.mobileFieldLabel}>Section</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="">-- All Sections --</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div className={styles.mobileFieldGroup}>
                <span className={styles.mobileFieldLabel}>Class</span>
                <select
                  value={selectedClass}
                  disabled={!selectedSection}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">-- All Classes --</option>
                  {filteredClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className={styles.mobileFieldGroup}>
                <span className={styles.mobileFieldLabel}>Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">-- All Subjects --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div className={styles.mobileFieldGroup}>
                <span className={styles.mobileFieldLabel}>Condition</span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {['new', 'good', 'fair', 'worn'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.chipButton} ${selectedCondition.includes(c) ? styles.chipButtonActive : ''}`}
                      onClick={() => handleConditionToggle(c)}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className={styles.mobileFieldGroup}>
                <span className={styles.mobileFieldLabel}>Price (FCFA)</span>
                <div className={styles.priceRangeInput} style={{ marginBottom: 0 }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.mobileSheetFooter}>
              <Button variant="secondary" onClick={handleClearAll}>
                Clear All
              </Button>
              <Button
                onClick={() => {
                  applyFilters({
                    section: selectedSection,
                    class: selectedClass,
                    subject: selectedSubject,
                    condition: selectedCondition,
                    minPrice,
                    maxPrice,
                  })
                  setIsMobileSheetOpen(false)
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
