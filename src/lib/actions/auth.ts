'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginSchema, SignupSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@/lib/schemas/auth'

import { verifyTurnstileToken } from '@/lib/utils/turnstile'

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const whatsappNumber = formData.get('whatsappNumber') as string
  const role = formData.get('role') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string

  // Validate Turnstile
  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) {
    return { error: 'Security verification failed. Please try again.' }
  }

  // Validate fields
  const validation = SignupSchema.safeParse({
    email,
    password,
    fullName,
    whatsappNumber,
    role,
  })

  if (!validation.success) {
    return {
      error: validation.error.issues[0].message,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: {
        full_name: validation.data.fullName,
        whatsapp_number: validation.data.whatsappNumber,
        role: validation.data.role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth-callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Registration successful! Please check your email to confirm your account.' }
}


export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validation = LoginSchema.safeParse({ email, password })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  const validation = ForgotPasswordSchema.safeParse({ email })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth-callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password reset link sent to your email.' }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string

  const validation = ResetPasswordSchema.safeParse({ password })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password updated successfully! You can now log in.' }
}
