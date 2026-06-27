'use client'

import { Check } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface Props {
  id: string
  label: string
  filled?: boolean
  textarea?: boolean
  optional?: boolean
  showCheck?: boolean
  children: ReactNode
}

export default function FloatingField({
  id,
  label,
  filled,
  textarea,
  optional,
  showCheck = true,
  children,
}: Props) {
  return (
    <div className={`f-field${textarea ? ' f-field--textarea' : ''}${filled ? ' f-field--filled' : ''}${showCheck ? '' : ' f-field--no-check'}`}>
      {children}
      <label className="f-label" htmlFor={id}>
        {label}
        {optional ? <span className="f-label-optional"> (optional)</span> : null}
      </label>
      {showCheck ? <Check className="f-check" size={16} weight="bold" aria-hidden="true" /> : null}
    </div>
  )
}
