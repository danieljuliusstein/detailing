'use client'

import { CaretLeft } from '@phosphor-icons/react'

export default function BackButton({ onClick, label = 'Go back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px 8px 4px 0',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <CaretLeft size={22} weight="bold" />
    </button>
  )
}
