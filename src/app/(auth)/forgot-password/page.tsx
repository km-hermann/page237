'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { ForgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/schemas/auth'
import { requestPasswordReset } from '@/lib/actions/auth'
import Input from '@/components/ui/Input/Input'
import Button from '@/components/ui/Button/Button'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('email', values.email)

    try {
      const result = await requestPasswordReset(null, formData)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        setLoading(false)
      } else if (result && 'success' in result && result.success) {
        setSuccess(result.success)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your email address and we'll send you a recovery link</p>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successAlert} role="alert">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input
              id="email"
              type="email"
              label="Email Address"
              required
              placeholder="e.g. john@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className={styles.actions}>
              <Button type="submit" loading={loading}>
                Send Recovery Link
              </Button>
            </div>
          </form>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Check your email inbox for a link to reset your password.
          </p>
        )}

        <div className={styles.footerLinks}>
          <Link href="/login" className={styles.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} /> Back to Log In
          </Link>
        </div>
      </div>
    </div>
  )
}
