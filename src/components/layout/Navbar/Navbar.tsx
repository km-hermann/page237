import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  let isLoggedIn = false
  let userEmail: string | null = null
  let userRole: string | null = null
  let isAdmin = false

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        isLoggedIn = true
        userEmail = user.email || null
        userRole = user.user_metadata?.role || null

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          userRole = profile.role
          isAdmin = Boolean(profile.is_admin)
        }
      }
    }
  } catch (error) {
    console.error('Navbar session fetch error:', error)
  }

  return (
    <NavbarClient 
      isLoggedIn={isLoggedIn} 
      userEmail={userEmail} 
      userRole={userRole} 
      isAdmin={isAdmin} 
    />
  )
}
