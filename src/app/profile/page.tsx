import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const metadata = {
  title: 'My Profile — Page237',
  description: 'Manage your profile and settings on Page237.',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  // Verify auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirectTo=/profile')
  }

  // Fetch profiles table record
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, whatsapp_number, email, role')
    .eq('user_id', user.id)
    .single()

  if (error || !profile) {
    redirect('/login')
  }

  const initialData = {
    fullName: profile.full_name,
    whatsappNumber: profile.whatsapp_number,
    email: profile.email,
    role: profile.role,
  }

  return <ProfileClient initialData={initialData} />
}
