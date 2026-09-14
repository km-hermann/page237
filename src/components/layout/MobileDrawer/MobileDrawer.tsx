'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, BookOpen, PlusCircle, LayoutDashboard, User, LogOut, LogIn, UserPlus, ShieldCheck } from 'lucide-react'
import styles from './MobileDrawer.module.css'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
  userRole?: string
  isAdmin: boolean
  onSignOut: () => Promise<void>
}

export default function MobileDrawer({ isOpen, onClose, isLoggedIn, userRole, isAdmin, onSignOut }: MobileDrawerProps) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    onClose()
  }

  const handleSignOutClick = async () => {
    await onSignOut()
    onClose()
  }

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} 
        onClick={onClose}
      />
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.header}>
          <span className={styles.title}>Menu</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navLinks}>
          <Link 
            href="/listings" 
            className={`${styles.navLink} ${pathname === '/listings' ? styles.activeLink : ''}`}
            onClick={handleLinkClick}
          >
            <BookOpen size={18} />
            Browse Books
          </Link>

          {isLoggedIn ? (
            <>
              {userRole === 'seller' && (
                <>
                  <Link 
                    href="/dashboard/new" 
                    className={`${styles.navLink} ${pathname === '/dashboard/new' ? styles.activeLink : ''}`}
                    onClick={handleLinkClick}
                  >
                    <PlusCircle size={18} />
                    Post a Book
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className={`${styles.navLink} ${pathname === '/dashboard' ? styles.activeLink : ''}`}
                    onClick={handleLinkClick}
                  >
                    <LayoutDashboard size={18} />
                    Seller Dashboard
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`${styles.navLink} ${pathname === '/admin' ? styles.activeLink : ''}`}
                  onClick={handleLinkClick}
                >
                  <ShieldCheck size={18} />
                  Admin
                </Link>
              )}
              <Link 
                href="/profile" 
                className={`${styles.navLink} ${pathname === '/profile' ? styles.activeLink : ''}`}
                onClick={handleLinkClick}
              >
                <User size={18} />
                My Profile
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className={`${styles.navLink} ${pathname === '/login' ? styles.activeLink : ''}`}
                onClick={handleLinkClick}
              >
                <LogIn size={18} />
                Log In
              </Link>
              <Link 
                href="/signup" 
                className={`${styles.navLink} ${pathname === '/signup' ? styles.activeLink : ''}`}
                onClick={handleLinkClick}
              >
                <UserPlus size={18} />
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {isLoggedIn && (
          <div className={styles.footer}>
            <button className={styles.signOutButton} onClick={handleSignOutClick}>
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  )
}
