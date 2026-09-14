import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={`${styles.footerContainer} container`}>
        <div className={styles.column}>
          <div className={styles.logo}>
            Page<span className={styles.logoAccent}>237</span>
          </div>
          <p className={styles.subtitle}>
            Buy, sell, and discover second-hand books, notes, and pamphlets across Cameroon.
          </p>
        </div>

        <div className={styles.column}>
          <div className={styles.heading}>Quick links</div>
          <nav className={styles.links}>
            <Link href="/listings" className={styles.link}>Browse books</Link>
            <Link href="/dashboard" className={styles.link}>Seller dashboard</Link>
            <Link href="/profile" className={styles.link}>Your profile</Link>
          </nav>
        </div>

        <div className={styles.column}>
          <div className={styles.heading}>Support</div>
          <p className={styles.linkText}>help@page237.cm</p>
          <p className={styles.linkText}>WhatsApp: +237 670 000 000</p>
          <p className={styles.copyText}>&copy; {currentYear} Page237. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
