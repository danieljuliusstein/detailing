import type { ReactNode } from 'react'

type BadgeTone = 'green' | 'yellow' | 'amber' | 'blue' | 'gray' | 'draft'

const TONE_CLASS: Record<BadgeTone, string> = {
  green: 'badge-status badge-status--green',
  yellow: 'badge-status badge-status--yellow',
  amber: 'badge-status badge-status--amber',
  blue: 'badge-status badge-status--blue',
  gray: 'badge-status badge-status--gray',
  draft: 'badge-draft',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export default function Badge({ tone = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`${TONE_CLASS[tone]}${className ? ` ${className}` : ''}`}>{children}</span>
  )
}
