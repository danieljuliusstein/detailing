'use client'

import { Check } from '@phosphor-icons/react'
import type { InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'placeholder'> {
  id: string
  label: string
  prefix?: string
  filled?: boolean
}

export default function FloatingAffixField({
  id,
  label,
  prefix = '$',
  filled,
  ...inputProps
}: Props) {
  const hasValue = filled ?? Boolean(String(inputProps.value ?? '').trim())

  return (
    <div className={`f-field f-field--affix${hasValue ? ' f-field--filled' : ''}`}>
      <div className="f-affix-wrap">
        <span className="f-affix-pre" aria-hidden="true">
          {prefix}
        </span>
        <input
          id={id}
          className={`f-input f-input--affix${hasValue ? ' hv' : ''}`}
          {...inputProps}
          placeholder=" "
        />
        <label className="f-label" htmlFor={id}>
          {label}
        </label>
      </div>
      <Check className="f-check" size={16} weight="bold" aria-hidden="true" />
    </div>
  )
}
