'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { ResetPasswordSchema, type ResetPasswordFormValues } from '@/lib/schemas/auth'
import { updatePassword } from '@/lib/actions/auth'
import Input from '@/components/ui/Input/Input'
import Button from '@/components/ui/Button/Button'
import styles from '../auth.module.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
    },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('password', values.password)

    try {
      const result = await updatePassword(null, formData)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        setLoading(false)
      } else if (result && 'success' in result && result.success) {
        setSuccess(result.success)
        setLoading(false)
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
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
          <h1 className={styles.title}>New Password</h1>
          <p className={styles.subtitle}>Please enter your new password below</p>
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
            <span>{success} Redirecting to login...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input
              id="password"
              type="password"
              label="New Password"
              placeholder="Min 6 characters, number & uppercase"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            <div className={styles.actions}>
              <Button type="submit" loading={loading}>
                Save New Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
