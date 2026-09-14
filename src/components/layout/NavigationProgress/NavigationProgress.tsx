'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { NAV_START_EVENT } from '@/lib/navigation'
import styles from './NavigationProgress.module.css'

const HIDE_DELAY_MS = 180
const SAFETY_TIMEOUT_MS = 12000

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
}

function isInternalNavigation(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false

  const url = new URL(anchor.href, window.location.href)
  if (url.origin !== window.location.origin) return false
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false
  }

  return true
}

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let hideTimer: number | undefined
    const stop = () => {
      window.clearTimeout(hideTimer)
      hideTimer = window.setTimeout(() => setPending(false), HIDE_DELAY_MS)
    }

    stop()
    return () => window.clearTimeout(hideTimer)
  }, [pathname, searchParams])

  useEffect(() => {
    let safetyTimer: number | undefined

    const start = () => {
      setPending(true)
      window.clearTimeout(safetyTimer)
      safetyTimer = window.setTimeout(() => setPending(false), SAFETY_TIMEOUT_MS)
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return
      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor?.href || !isInternalNavigation(anchor)) return
      start()
    }

    const onSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented) return
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (form.method.toLowerCase() === 'dialog') return
      if (form.target && form.target !== '_self') return
      start()
    }

    window.addEventListener(NAV_START_EVENT, start)
    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    window.addEventListener('popstate', start)

    return () => {
      window.clearTimeout(safetyTimer)
      window.removeEventListener(NAV_START_EVENT, start)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
      window.removeEventListener('popstate', start)
    }
  }, [])

  useEffect(() => {
    document.body.style.cursor = pending ? 'progress' : ''
    document.body.toggleAttribute('aria-busy', pending)
    return () => {
      document.body.style.cursor = ''
      document.body.removeAttribute('aria-busy')
    }
  }, [pending])

  if (!pending) return null

  return (
    <>
      <div className={styles.bar} aria-hidden="true">
        <div className={styles.barFill} />
      </div>
      <div className={styles.overlay} role="status" aria-live="polite" aria-label="Loading page">
        <div className={`${styles.card} `}>
          <div className={styles.spinner} aria-hidden="true">
            <span className={`${styles.ring} ${styles.ringOuter}`} />
            <span className={`${styles.ring} ${styles.ringInner}`} />
          </div>          
        </div>
      </div>
    </>
  )
}
