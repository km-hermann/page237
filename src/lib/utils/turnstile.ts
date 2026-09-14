export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not defined. Skipping verification in development.')
    return true // Allow bypass if not configured to facilitate local development
  }

  if (!token) {
    return false
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    })

    const data = await response.json()
    return !!data.success
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return false
  }
}
