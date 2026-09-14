'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import styles from './ThemeToggle.module.css'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Read the current theme from the HTML attribute set by the server
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark'
    if (currentTheme) {
      setTheme(currentTheme)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    
    // Set the cookie so the server knows the theme on next load
    document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`
    
    // Update the DOM attribute
    document.documentElement.setAttribute('data-theme', nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggleButton}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon className={styles.icon} />
      ) : (
        <Sun className={styles.icon} />
      )}
    </button>
  )
}
