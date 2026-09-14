'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, PlusCircle, LayoutDashboard, User, LogOut, Menu, BookOpenCheck, ShieldCheck } from 'lucide-react'
import styles from './Navbar.module.css'
import ThemeToggle from '../ThemeToggle/ThemeToggle'
import MobileDrawer from '../MobileDrawer/MobileDrawer'
import { signOut } from '@/lib/actions/auth'

interface NavbarClientProps {
  isLoggedIn: boolean
  userEmail: string | null
  userRole: string | null
  isAdmin: boolean
}

export default function NavbarClient({ isLoggedIn, userEmail, userRole, isAdmin }: NavbarClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className={styles.header}>
      <div className={`${styles.navContainer} container`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <BookOpenCheck className={styles.logoAccent} size={28} />
          <span>Page<span className={styles.logoAccent}>237</span></span>
        </Link>

        {/* Desktop Links */}
        <nav className={styles.navLinks}>
          <Link 
            href="/listings" 
            className={`${styles.navLink} ${pathname === '/listings' ? styles.activeLink : ''}`}
          >
            <BookOpen size={16} />
            Browse
          </Link>

          {isLoggedIn && userRole === 'seller' && (
            <>
              <Link 
                href="/dashboard/new" 
                className={`${styles.navLink} ${pathname === '/dashboard/new' ? styles.activeLink : ''}`}
              >
                <PlusCircle size={16} />
                Post Book
              </Link>
              <Link 
                href="/dashboard" 
                className={`${styles.navLink} ${pathname === '/dashboard' ? styles.activeLink : ''}`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            </>
          )}

          {isLoggedIn && isAdmin && (
            <Link 
              href="/admin" 
              className={`${styles.navLink} ${pathname === '/admin' ? styles.activeLink : ''}`}
            >
              <ShieldCheck size={16} />
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <ThemeToggle />

          {/* Desktop Auth */}
          <div className={styles.desktopActions}>
            {isLoggedIn ? (
              <>
                <Link 
                  href="/profile" 
                  className={`${styles.navLink} ${pathname === '/profile' ? styles.activeLink : ''}`}
                  title={userEmail || 'Profile'}
                >
                  <User size={18} />
                </Link>
                <button onClick={handleSignOut} className={styles.btnSecondary} aria-label="Sign Out">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.btnSecondary}>
                  Log In
                </Link>
                <Link href="/signup" className={styles.btnPrimary}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button 
            className={styles.menuButton} 
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        isLoggedIn={isLoggedIn}
        userRole={userRole || undefined}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />
    </header>
  )
}
