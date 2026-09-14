import React from 'react'
import styles from './Input.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required = false, className = '', ...props }, ref) => {
    const inputClass = `${styles.input} ${error ? styles.inputError : ''} ${className}`

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
        <input ref={ref} className={inputClass} {...props} />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
