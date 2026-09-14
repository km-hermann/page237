'use client'

import type { FormHTMLAttributes } from 'react'
import { startNavigation } from '@/lib/navigation'

export default function PendingForm({
  onSubmit,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      {...props}
      onSubmit={(event) => {
        startNavigation()
        onSubmit?.(event)
      }}
    />
  )
}
