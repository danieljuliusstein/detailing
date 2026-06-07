'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'

interface BottomSheetProps {
  title: string
  subtitle?: string
  ariaLabel?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function BottomSheet({
  title,
  subtitle,
  ariaLabel,
  onClose,
  children,
  footer,
}: BottomSheetProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="inv-sheet-root" role="dialog" aria-modal="true" aria-label={ariaLabel ?? title}>
      <button type="button" className="inv-sheet-overlay" onClick={onClose} aria-label="Close" />
      <div className="inv-sheet">
        <div className="inv-sheet-handle" />
        <div className="inv-sheet-top">
          <div className="inv-sheet-top-text">
            <div className="inv-sheet-title">{title}</div>
            {subtitle ? <div className="inv-sheet-subtitle">{subtitle}</div> : null}
          </div>
          <button type="button" className="inv-sheet-close" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>,
    document.body
  )
}
