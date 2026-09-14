'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { LoginSchema, type LoginFormValues } from '@/lib/schemas/auth'
import { signIn } from '@/lib/actions/auth'
import Input from '@/components/ui/Input/Input'
import Button from '@/components/ui/Button/Button'
import styles from '../auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error'))

  const redirectTo = searchParams.get('redirectTo')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', values.email)
    formData.append('password', values.password)

    try {
      const result = await signIn(null, formData)
      if (result && 'error' in result && result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        router.push(redirectTo || '/')
        router.refresh()
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
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Log in to browse and manage book listings</p>
        </div>

        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            id="email"
            type="email"
            label="Email Address"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            id="password"
            type="password"
            label="Password"
            required
            error={errors.password?.message}
            {...register('password')}
          />

          <Link href="/forgot-password" className={styles.forgotPasswordLink}>
            Forgot password?
          </Link>

          <div className={styles.actions}>
            <Button type="submit" loading={loading}>
              Log In
            </Button>
          </div>
        </form>

        <div className={styles.footerLinks}>
          Don't have an account?{' '}
          <Link href="/signup" className={styles.link}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
