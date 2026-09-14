'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit2, CheckSquare, Trash2 } from 'lucide-react'
import { markAsSold, deleteListing } from '@/lib/actions/listings'
import styles from './page.module.css'

interface DashboardActionsProps {
  listingId: string
  status: 'available' | 'sold'
}

export default function DashboardActions({ listingId, status }: DashboardActionsProps) {
  const [loadingSold, setLoadingSold] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const handleMarkAsSold = async () => {
    if (loadingSold) return
    
    setLoadingSold(true)
    try {
      const result = await markAsSold(listingId)
      if (result && 'error' in result && result.error) {
        alert(result.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update listing')
    } finally {
      setLoadingSold(false)
    }
  }

  const handleDelete = async () => {
    if (loadingDelete) return

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this listing? This action cannot be undone.'
    )
    if (!confirmDelete) return

    setLoadingDelete(true)
    try {
      const result = await deleteListing(listingId)
      if (result && 'error' in result && result.error) {
        alert(result.error)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing')
    } finally {
      setLoadingDelete(false)
    }
  }

  return (
    <div className={styles.cardActions}>
      <Link href={`/dashboard/${listingId}/edit`} className={styles.editBtn}>
        <Edit2 size={14} />
        Edit
      </Link>

      {status === 'available' ? (
        <button
          onClick={handleMarkAsSold}
          disabled={loadingSold}
          className={styles.actionBtn}
        >
          <CheckSquare size={14} />
          {loadingSold ? 'Updating...' : 'Mark Sold'}
        </button>
      ) : (
        <div 
          className={styles.badge} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0 }}
        >
          Sold Out
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={loadingDelete}
        className={styles.deleteBtn}
      >
        <Trash2 size={14} />
        {loadingDelete ? 'Deleting...' : 'Delete Listing'}
      </button>
    </div>
  )
}
