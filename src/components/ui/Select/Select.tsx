import React from 'react'
import styles from './Select.module.css'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required = false, children, className = '', ...props }, ref) => {
    const selectClass = `${styles.select} ${error ? styles.selectError : ''} ${className}`

    return (
      <div className={styles.wrapper}>
        {label && (
          <label className={styles.label} htmlFor={props.id}>
            <span>
              {label}
              {required && <span className={styles.required}>*</span>}
            </span>
          </label>
        )}
        <select ref={ref} className={selectClass} {...props}>
          {children}
        </select>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
