'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Turnstile } from '@marsidev/react-turnstile'
import { AlertCircle, CheckCircle2, UserCheck, BookOpenCheck } from 'lucide-react'
import { SignupSchema, type SignupFormValues } from '@/lib/schemas/auth'
import { signUp } from '@/lib/actions/auth'
import Input from '@/components/ui/Input/Input'
import Button from '@/components/ui/Button/Button'
import styles from '../auth.module.css'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fullName: '',
      whatsappNumber: '',
      email: '',
      password: '',
      role: 'buyer',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (values: SignupFormValues) => {
    if (!turnstileToken) {
      setError('Please complete the security check.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('fullName', values.fullName)
    formData.append('whatsappNumber', values.whatsappNumber)
    formData.append('email', values.email)
    formData.append('password', values.password)
    formData.append('role', values.role)
    formData.append('cf-turnstile-response', turnstileToken)

    try {
      const result = await signUp(null, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        setSuccess(result.success)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleRoleSelect = (role: 'buyer' | 'seller') => {
    setValue('role', role)
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Page237 to buy or sell books</p>
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

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <Input
              id="fullName"
              type="text"
              label="Full Name"
              placeholder="e.g. John Doe"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              id="whatsappNumber"
              type="tel"
              label="WhatsApp Number"
              placeholder="e.g. 670000000"
              required
              error={errors.whatsappNumber?.message}
              {...register('whatsappNumber')}
            />

            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="e.g. john@example.com"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="Min 6 characters, number & uppercase"
              required
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Premium Role Selection Cards */}
            <div style={{ marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
              I want to: <span style={{ color: 'var(--error)' }}>*</span>
            </div>
            <div className={styles.roleSelector}>
              <div 
                className={`${styles.roleCard} ${selectedRole === 'buyer' ? styles.roleCardActive : ''}`}
                onClick={() => handleRoleSelect('buyer')}
              >
                <BookOpenCheck size={24} className={selectedRole === 'buyer' ? 'text-accent' : ''} />
                <span className={styles.roleTitle}>Buy Books</span>
                <span className={styles.roleDesc}>Browse, search, and contact sellers</span>
              </div>
              <div 
                className={`${styles.roleCard} ${selectedRole === 'seller' ? styles.roleCardActive : ''}`}
                onClick={() => handleRoleSelect('seller')}
              >
                <UserCheck size={24} className={selectedRole === 'seller' ? 'text-accent' : ''} />
                <span className={styles.roleTitle}>Sell Books</span>
                <span className={styles.roleDesc}>Create listings and reach buyers</span>
              </div>
            </div>
            {errors.role && <span className={styles.error} style={{ marginBottom: '1rem' }}>{errors.role.message}</span>}

            {/* Turnstile Widget */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} // fallback testing key
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setError(null)
                }}
                onError={() => setError('Security verification failed. Please refresh the page.')}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>

            <div className={styles.actions}>
              <Button type="submit" loading={loading}>
                Register
              </Button>
            </div>
          </form>
        )}

        <div className={styles.footerLinks}>
          Already have an account?{' '}
          <Link href="/login" className={styles.link}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}
