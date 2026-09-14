'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Turnstile } from '@marsidev/react-turnstile'
import { AlertCircle, CheckCircle2, ArrowLeft, Info, HelpCircle } from 'lucide-react'
import { ContactSchema, type ContactFormValues } from '@/lib/schemas/contact'
import { ReportSchema, type ReportFormValues } from '@/lib/schemas/report'
import { contactSeller } from '@/lib/actions/contact'
import { reportListing } from '@/lib/actions/reports'
import Button from '@/components/ui/Button/Button'
import styles from './page.module.css'

interface ContactClientProps {
  listingId: string
  listingTitle: string
  sellerName: string
  listingPrice: number
  isReport: boolean
}

export default function ContactClient({
  listingId,
  listingTitle,
  sellerName,
  listingPrice,
  isReport,
}: ContactClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const defaultMessage = `Hello, I'm interested in your book "${listingTitle}" listed on Page237 for ${listingPrice.toLocaleString()} FCFA. Is it still available?`

  // 1. Setup forms conditionally based on type
  const {
    register: registerContact,
    handleSubmit: handleSubmitContact,
    formState: { errors: errorsContact },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      message: defaultMessage,
    },
  })

  const {
    register: registerReport,
    handleSubmit: handleSubmitReport,
    formState: { errors: errorsReport },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      reason: '',
    },
  })

  // 2. Submit Handlers
  const onContactSubmit = async (values: ContactFormValues) => {
    if (!turnstileToken) {
      setError('Please complete the security check.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await contactSeller(listingId, values.message, turnstileToken)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success && result.whatsappUrl) {
        setSuccess('Redirecting you to WhatsApp...')
        // Open deep link
        window.location.href = result.whatsappUrl
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  const onReportSubmit = async (values: ReportFormValues) => {
    if (!turnstileToken) {
      setError('Please complete the security check.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await reportListing(listingId, values.reason, turnstileToken)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        setSuccess('Thank you! This listing has been reported and will be reviewed by an admin.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  const formTitle = isReport ? 'Report Listing' : 'Confirm WhatsApp Handoff'
  const formSubtitle = isReport ? (
    <span>
      Please explain why you are flagging <span className={styles.bookHighlight}>"{listingTitle}"</span>. Admin will investigate.
    </span>
  ) : (
    <span>
      You are about to contact <span className={styles.bookHighlight}>{sellerName}</span> regarding{' '}
      <span className={styles.bookHighlight}>"{listingTitle}"</span>.
    </span>
  )

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.header}>
          <Link href={`/listings/${listingId}`} className={styles.backLink}>
            <ArrowLeft size={14} /> Back to book details
          </Link>
          <h1 className={styles.title}>{formTitle}</h1>
          <p className={styles.subtitle}>{formSubtitle}</p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', color: 'var(--error)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {!success && !isReport && (
          <form onSubmit={handleSubmitContact(onContactSubmit)} className={styles.form}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="message" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                WhatsApp Prefilled Message
              </label>
              <textarea
                id="message"
                className={`${styles.textarea} glass-panel`}
                style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                {...registerContact('message')}
              />
              {errorsContact.message && <span style={{ fontSize: '0.8rem', color: 'var(--error)' }}>{errorsContact.message.message}</span>}
            </div>

            <div className={styles.infoBox}>
              <Info size={16} className={styles.infoIcon} />
              <span>
                Once you click the button, WhatsApp will open with your prefilled message. You can edit it before sending.
              </span>
            </div>

            {/* Turnstile widget */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setError(null)
                }}
                onError={() => setError('Security verification failed. Please refresh the page.')}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>

            <div className={styles.actions}>
              <Button type="submit" className={styles.btnPrimary} loading={loading}>
                Open WhatsApp
              </Button>
            </div>
          </form>
        )}

        {!success && isReport && (
          <form onSubmit={handleSubmitReport(onReportSubmit)} className={styles.form}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="reason" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Reason for Reporting
              </label>
              <textarea
                id="reason"
                placeholder="Please describe why this listing should be removed (e.g. scam, duplicate, wrong details, already sold)..."
                className={`${styles.textarea} glass-panel`}
                style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                {...registerReport('reason')}
              />
              {errorsReport.reason && <span style={{ fontSize: '0.8rem', color: 'var(--error)' }}>{errorsReport.reason.message}</span>}
            </div>

            {/* Turnstile widget */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setError(null)
                }}
                onError={() => setError('Security verification failed. Please refresh the page.')}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>

            <div className={styles.actions}>
              <Button type="submit" variant="danger" className={styles.btnPrimary} loading={loading}>
                Submit Report
              </Button>
            </div>
          </form>
        )}

        {success && (
          <div className={styles.actions} style={{ marginTop: '1rem' }}>
            <Link href={`/listings/${listingId}`} className={styles.btnSecondary} style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', textDecoration: 'none' }}>
              Return to Book details
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
