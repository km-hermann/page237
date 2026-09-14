'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'
import Input from '@/components/ui/Input/Input'
import Button from '@/components/ui/Button/Button'
import styles from './page.module.css'

const ProfileUpdateSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be under 50 characters'),
  whatsappNumber: z.string()
    .min(9, 'WhatsApp number must be at least 9 digits')
    .max(15, 'WhatsApp number is too long'),
})

type ProfileUpdateFormValues = z.infer<typeof ProfileUpdateSchema>

interface ProfileClientProps {
  initialData: {
    fullName: string
    whatsappNumber: string
    email: string
    role: string
  }
}

export default function ProfileClient({ initialData }: ProfileClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      fullName: initialData.fullName,
      whatsappNumber: initialData.whatsappNumber,
    },
  })

  const onSubmit = async (values: ProfileUpdateFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateProfile(values)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        setSuccess('Profile updated successfully!')
        setLoading(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>View and update your account details.</p>

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

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Read only email */}
          <div className={styles.readOnlyField}>
            <span className={styles.readOnlyLabel}>Email Address</span>
            <span className={styles.readOnlyValue}>{initialData.email}</span>
          </div>

          {/* Read only role */}
          <div className={styles.readOnlyField}>
            <span className={styles.readOnlyLabel}>Account Role</span>
            <span className={styles.readOnlyValue} style={{ textTransform: 'capitalize' }}>
              {initialData.role}
            </span>
          </div>

          <Input
            id="fullName"
            type="text"
            label="Full Name"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            id="whatsappNumber"
            type="tel"
            label="WhatsApp Number"
            required
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
