const PLACEHOLDER_PREFIX = 'your-'

function readPublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '',
  }
}

function isPlaceholder(value: string) {
  return value.startsWith(PLACEHOLDER_PREFIX)
}

/** True when real Supabase URL + anon key are set (not example placeholders). */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readPublicEnv()
  return Boolean(url && anonKey && !isPlaceholder(url) && !isPlaceholder(anonKey))
}

export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const { url, anonKey } = readPublicEnv()

  if (!url || !anonKey || isPlaceholder(url) || isPlaceholder(anonKey)) {
    throw new Error(
      'Supabase is not configured. Copy .env.local.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your project API settings: https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  return { url, anonKey }
}
